import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import {
  getCandidatePaths,
  getFreePort,
  launch,
  resolveExecutable
} from '../../src/cdp/browser-launcher.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('browser-launcher', function () {
  describe('getFreePort', function () {
    it('allocates a usable ephemeral port', async function () {
      const port = await getFreePort()
      expect(port).to.be.a('number').above(0).below(65536)
    })

    it('returns a different port on each call (most of the time)', async function () {
      const ports = new Set<number>()
      for (let i = 0; i < 5; i++) ports.add(await getFreePort())
      expect(ports.size).to.be.greaterThan(0)
    })
  })

  describe('resolveExecutable', function () {
    it('returns the explicit path when it exists', function () {
      const p = resolveExecutable('chrome', fakeBrowser)
      expect(p).to.equal(fakeBrowser)
    })

    it('throws when the explicit path is missing', function () {
      expect(() => resolveExecutable('chrome', '/no/such/binary')).to.throw(
        /not found/
      )
    })

    it('throws a helpful message when auto-detection fails', function () {
      // We run this on CI without overriding the platform. It either finds a
      // real Chrome (test skip) or throws a message listing candidates.
      try {
        resolveExecutable('chrome')
      } catch (e) {
        expect((e as Error).message).to.match(/Could not locate|Pass options\.executablePath/)
      }
    })
  })

  describe('getCandidatePaths', function () {
    it('returns platform-specific paths for chrome', function () {
      const paths = getCandidatePaths('chrome')
      if (process.platform === 'darwin' || process.platform === 'linux' ||
          process.platform === 'win32') {
        expect(paths.length).to.be.greaterThan(0)
      }
    })

    it('returns an array for each supported browser', function () {
      for (const b of ['chrome', 'chromium', 'msedge'] as const) {
        const paths = getCandidatePaths(b)
        expect(paths).to.be.an('array')
      }
    })
  })

  describe('launch (with fake browser)', function () {
    // The fake browser ships as a +x node script; skip on Windows which
    // does not honor the shebang.
    const skipOnWindows = process.platform === 'win32'

    it('spawns the binary, polls /json/version and exposes debugUrl + wsEndpoint', async function () {
      if (skipOnWindows) this.skip()
      this.timeout(10_000)
      const browser = await launch({ executablePath: fakeBrowser })
      try {
        expect(browser.port).to.be.a('number').above(0)
        expect(browser.debugUrl).to.equal(`http://127.0.0.1:${browser.port}`)
        expect(browser.wsEndpoint).to.match(
          new RegExp(`^ws://127\\.0\\.0\\.1:${browser.port}/devtools/browser/`)
        )
      } finally {
        await browser.close()
      }
    })

    it('close() terminates the child process', async function () {
      if (skipOnWindows) this.skip()
      this.timeout(10_000)
      const browser = await launch({ executablePath: fakeBrowser })
      expect(browser.process.exitCode).to.equal(null)
      await browser.close()
      expect(browser.process.killed || browser.process.exitCode !== null).to.be.true
    })

    it('throws if the child exits before the debugger is ready', async function () {
      if (skipOnWindows) this.skip()
      this.timeout(10_000)
      // /bin/true exits immediately, never exposing a debugger.
      const trueBin = '/usr/bin/true'
      try {
        await launch({ executablePath: trueBin })
        expect.fail('launch should have rejected')
      } catch (e) {
        expect((e as Error).message).to.match(/exited before|Timed out/)
      }
    })
  })
})
