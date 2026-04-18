import { expect } from 'chai'
import { createServer, Server } from 'http'
import type { AddressInfo } from 'net'
import { BrowserType, Using, WebDriver } from '../../src/index.js'
import { getCandidatePaths } from '../../src/cdp/browser-launcher.js'

const envExec = process.env.CDP_EXECUTABLE_PATH
const envBrowser = (process.env.CDP_BROWSER || 'chrome') as
  | 'chrome'
  | 'chromium'
  | 'msedge'
const headless = process.env.CDP_HEADLESS !== '0'

function pickExec(): string | undefined {
  if (envExec) return envExec
  const candidates = getCandidatePaths(envBrowser)
  return candidates.find(Boolean)
}

const executablePath = pickExec()

describe('CDP integration — Chrome/Chromium', function () {
  if (!executablePath) {
    it.skip('skipped: no Chromium-family binary detected (set CDP_EXECUTABLE_PATH to enable)', () => {})
    return
  }
  this.timeout(60_000)

  let wd: WebDriver
  let browser: Awaited<ReturnType<WebDriver['start']>>
  let server: Server
  let baseUrl: string

  before(async function () {
    const body = `<!doctype html><html><head><title>Hello</title></head>
<body>
  <h1 id="title">Hi</h1>
  <a href="#" class="link">Open</a>
  <input id="box" value="hello" />
  <button id="btn" disabled>No</button>
</body></html>`
    server = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(body)
    })
    await new Promise<void>(resolve =>
      server.listen(0, '127.0.0.1', () => resolve())
    )
    const addr = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${addr.port}/`
  })

  after(async function () {
    await new Promise<void>(resolve => server.close(() => resolve()))
  })

  beforeEach(async function () {
    wd = WebDriver.cdp({
      browser: envBrowser,
      executablePath,
      headless
    })
    browser = await wd.start(BrowserType.Chrome)
    await browser.navigate().to(baseUrl)
  })

  afterEach(async function () {
    try {
      await browser?.close()
    } catch {
      /* noop */
    }
  })

  it('reads title + URL', async function () {
    expect(await browser.getTitle()).to.equal('Hello')
    expect(await browser.navigate().getCurrentURL()).to.contain('127.0.0.1')
  })

  it('findElement by css returns a wrapper, with text', async function () {
    const h1 = await browser.findElement(Using.css, '#title')
    expect(await h1.getText()).to.equal('Hi')
  })

  it('findElements by class returns multiple', async function () {
    const anchors = await browser.findElements(Using.css, '.link')
    expect(anchors).to.have.length(1)
  })

  it('sendKeys + getValue round-trips', async function () {
    const input = await browser.findElement(Using.css, '#box')
    await input.clear()
    await input.sendKeys('world')
    expect(await input.getValue()).to.equal('world')
  })

  it('isEnabled picks up disabled attribute', async function () {
    const btn = await browser.findElement(Using.css, '#btn')
    expect(await btn.isEnabled()).to.equal(false)
  })

  it('executeSync returns primitives', async function () {
    const r = await browser.executeSync('return 2 + 3')
    expect(r).to.equal(5)
  })

  it('screenshot returns base64 data', async function () {
    const data = await browser.screenshot()
    expect(data).to.be.a('string').of.length.greaterThan(100)
  })

  it('cookies round-trip', async function () {
    await browser.cookie().create({ name: 'k', value: 'v', path: '/' })
    const all = await browser.cookie().getAll()
    expect(all.find(c => c.name === 'k')?.value).to.equal('v')
  })
})
