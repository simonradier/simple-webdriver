import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F12 — windows)', function () {
  this.timeout(10_000)
  const skipOnWindows = process.platform === 'win32'

  let driver: CDPDriver
  let sessionId: string

  beforeEach(async function () {
    if (skipOnWindows) this.skip()
    driver = new CDPDriver({ executablePath: fakeBrowser })
    const session = await driver.startSession('chrome', new Capabilities('chrome' as any))
    sessionId = session.sessionId
  })

  afterEach(async function () {
    if (driver && sessionId) await driver.stopSession(sessionId)
  })

  it('windowGetHandle returns the current target id', async function () {
    const h = await driver.windowGetHandle(sessionId)
    expect(h).to.be.a('string').of.length.greaterThan(0)
  })

  it('windowGetHandles returns at least the current window', async function () {
    const hs = await driver.windowGetHandles(sessionId)
    expect(hs).to.be.an('array').of.length.greaterThan(0)
  })

  it('windowCreate returns a new handle', async function () {
    const { handle, type } = await driver.windowCreate(sessionId, 'tab')
    expect(handle).to.be.a('string').of.length.greaterThan(0)
    expect(type).to.equal('tab')
  })

  it('windowGetRect returns x/y/width/height', async function () {
    const r = await driver.windowGetRect(sessionId)
    expect(r).to.include.keys('x', 'y', 'width', 'height')
  })

  it('frameSwitch(null) is a noop', async function () {
    await driver.frameSwitch(sessionId, null)
  })

  it('frameToParent is a noop at top level', async function () {
    await driver.frameToParent(sessionId)
  })
})
