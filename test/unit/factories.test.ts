import { expect } from 'chai'
import { Protocol, WebDriver } from '../../src/index.js'

describe('WebDriver factories', function () {
  describe('WebDriver.w3c', function () {
    it('returns a WebDriver instance configured against the given URL', function () {
      const wd = WebDriver.w3c('http://localhost:9515')
      expect(wd).to.be.instanceOf(WebDriver)
      expect(wd.serverURL.href).to.equal('http://localhost:9515/')
    })

    it('rejects non-http(s) URLs', function () {
      expect(() => WebDriver.w3c('ws://localhost:9515')).to.throw(TypeError)
    })

    it('produces the same shape as the legacy constructor', function () {
      const a = WebDriver.w3c('http://localhost:9515')
      const b = new WebDriver('http://localhost:9515', Protocol.W3C)
      expect(a.serverURL.href).to.equal(b.serverURL.href)
    })
  })

  describe('WebDriver.cdp', function () {
    it('returns a WebDriver instance (CDP driver)', function () {
      const wd = WebDriver.cdp({ browser: 'chrome' })
      expect(wd).to.be.instanceOf(WebDriver)
    })

    it('accepts an empty options object', function () {
      const wd = WebDriver.cdp()
      expect(wd).to.be.instanceOf(WebDriver)
    })

    it('start() without a valid browser binary rejects', async function () {
      const wd = WebDriver.cdp({ browser: 'chrome', executablePath: '/no/such/bin' })
      let caught: unknown
      try {
        await wd.start('chrome' as any)
      } catch (e) {
        caught = e
      }
      expect(caught).to.be.instanceOf(Error)
    })
  })
})
