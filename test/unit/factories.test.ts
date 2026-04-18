import { expect } from 'chai'
import {
  CDPNotImplementedError,
  Protocol,
  WebDriver
} from '../../src/index.js'

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
    it('throws CDPNotImplementedError until the CDP driver lands', function () {
      expect(() => WebDriver.cdp({ browser: 'chrome' })).to.throw(CDPNotImplementedError)
    })

    it('accepts an empty options object', function () {
      expect(() => WebDriver.cdp()).to.throw(CDPNotImplementedError)
    })
  })
})
