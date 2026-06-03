import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F7 — navigation)', function () {
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

  it('navigateTo updates the current URL', async function () {
    await driver.navigateTo(sessionId, 'https://example.com/?title=Hello')
    const url = await driver.getCurrentUrl(sessionId)
    expect(url).to.equal('https://example.com/?title=Hello')
  })

  it('getTitle returns the tracked title', async function () {
    await driver.navigateTo(sessionId, 'https://example.com/?title=Hello')
    const title = await driver.getTitle(sessionId)
    expect(title).to.equal('Hello')
  })

  it('navigateRefresh completes without error', async function () {
    await driver.navigateTo(sessionId, 'https://example.com/')
    await driver.navigateRefresh(sessionId)
  })

  it('navigateBack / navigateForward are safe on single-entry history', async function () {
    await driver.navigateTo(sessionId, 'https://example.com/')
    await driver.navigateBack(sessionId)
    await driver.navigateForward(sessionId)
  })
})
