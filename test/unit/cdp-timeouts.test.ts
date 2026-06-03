import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F17 — timeouts)', function () {
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

  it('script timeout trips executeAsync when the script never resolves', async function () {
    await driver.timeoutsSet(sessionId, { script: 100 })
    let caught: unknown
    try {
      await driver.executeAsync(
        sessionId,
        'return new Promise(function() { /* never resolves */ });',
        []
      )
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).to.match(/timed out/)
  })

  it('scriptTimeout=0 disables the guard (short script still succeeds)', async function () {
    await driver.timeoutsSet(sessionId, { script: 0 })
    const r = await driver.executeSync(sessionId, 'return 1 + 1;', [])
    expect(r).to.equal(2)
  })
})
