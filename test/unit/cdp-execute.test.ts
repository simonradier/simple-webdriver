import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F8 — execute scripts)', function () {
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

  it('executeSync returns primitive results', async function () {
    const n = await driver.executeSync(sessionId, 'return 2 + 3;', [])
    expect(n).to.equal(5)
  })

  it('executeSync receives arguments', async function () {
    const r = await driver.executeSync(
      sessionId,
      'return arguments[0] * arguments[1];',
      [3, 7]
    )
    expect(r).to.equal(21)
  })

  it('executeSync surfaces script errors', async function () {
    let caught: unknown
    try {
      await driver.executeSync(sessionId, 'throw new Error("boom");', [])
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).to.match(/boom|Script error/)
  })

  it('executeAsync awaits promises', async function () {
    const v = await driver.executeAsync(
      sessionId,
      'return Promise.resolve(arguments[0] + 1);',
      [41]
    )
    expect(v).to.equal(42)
  })

  it('getTitle after navigate uses the script path under the hood', async function () {
    await driver.navigateTo(sessionId, 'https://example.com/?title=Live')
    const t = await driver.getTitle(sessionId)
    expect(t).to.equal('Live')
  })
})
