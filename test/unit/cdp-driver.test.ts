import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { CDPNotImplementedError } from '../../src/cdp/errors.js'
import { WebDriver } from '../../src/index.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F6 — session lifecycle)', function () {
  this.timeout(10_000)
  const skipOnWindows = process.platform === 'win32'

  it('startSession launches the browser, attaches, returns a SessionDef', async function () {
    if (skipOnWindows) this.skip()
    const driver = new CDPDriver({ executablePath: fakeBrowser })
    const caps = new Capabilities('chrome' as any)
    const session = await driver.startSession('chrome', caps)
    try {
      expect(session.sessionId).to.be.a('string').of.length.greaterThan(0)
      expect(session.capabilities.browserName).to.equal('chrome')
      expect(session.capabilities.browserVersion).to.contain('FakeChrome')
      expect(session.capabilities.timeouts).to.include.keys(
        'implicit',
        'pageLoad',
        'script'
      )
      expect(driver.openSessionCount).to.equal(1)
    } finally {
      await driver.stopSession(session.sessionId)
      expect(driver.openSessionCount).to.equal(0)
    }
  })

  it('getStatus reports ready', async function () {
    const driver = new CDPDriver()
    const status = await driver.getStatus()
    expect(status.ready).to.equal(true)
    expect(status.message).to.be.a('string')
  })

  it('stopSession on an unknown id is a noop', async function () {
    const driver = new CDPDriver()
    await driver.stopSession('does-not-exist') // must not throw
  })

  it('timeouts can be read and written per session', async function () {
    if (skipOnWindows) this.skip()
    const driver = new CDPDriver({ executablePath: fakeBrowser })
    const caps = new Capabilities('chrome' as any)
    const session = await driver.startSession('chrome', caps)
    try {
      const t0 = await driver.timeoutsGet(session.sessionId)
      expect(t0).to.include.keys('implicit', 'pageLoad', 'script')
      await driver.timeoutsSet(session.sessionId, { implicit: 1234 })
      const t1 = await driver.timeoutsGet(session.sessionId)
      expect(t1.implicit).to.equal(1234)
      expect(t1.pageLoad).to.equal(t0.pageLoad)
    } finally {
      await driver.stopSession(session.sessionId)
    }
  })

  it('nested frameSwitch throws CDPNotImplementedError', async function () {
    if (skipOnWindows) this.skip()
    const driver = new CDPDriver({ executablePath: fakeBrowser })
    const caps = new Capabilities('chrome' as any)
    const session = await driver.startSession('chrome', caps)
    try {
      let caught: unknown
      try {
        await driver.frameSwitch(session.sessionId, 'some-frame')
      } catch (e) {
        caught = e
      }
      expect(caught).to.be.instanceOf(CDPNotImplementedError)
    } finally {
      await driver.stopSession(session.sessionId)
    }
  })

  it('WebDriver.cdp() + start() end-to-end with the fake browser', async function () {
    if (skipOnWindows) this.skip()
    const wd = WebDriver.cdp({ executablePath: fakeBrowser })
    const browser = await wd.start('chrome' as any)
    try {
      expect(browser.session).to.be.a('string').of.length.greaterThan(0)
      expect(browser.browserType).to.equal('chrome')
    } finally {
      await browser.close()
    }
  })
})
