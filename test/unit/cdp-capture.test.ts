import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F14 — screenshots, source, print)', function () {
  this.timeout(10_000)
  const skipOnWindows = process.platform === 'win32'

  let driver: CDPDriver
  let sessionId: string

  beforeEach(async function () {
    if (skipOnWindows) this.skip()
    driver = new CDPDriver({ executablePath: fakeBrowser })
    const session = await driver.startSession('chrome', new Capabilities('chrome' as any))
    sessionId = session.sessionId
    const raw = (driver as any)._session(sessionId)
    await raw.client.send(
      'Fake.setup',
      {
        elements: [
          {
            tag: 'html',
            children: [{ tag: 'body', children: [{ tag: 'h1', text: 'Hi' }] }]
          }
        ]
      },
      raw.cdpSessionId
    )
  })

  afterEach(async function () {
    if (driver && sessionId) await driver.stopSession(sessionId)
  })

  it('screenshot returns base64 data', async function () {
    const data = await driver.screenshot(sessionId)
    expect(data).to.be.a('string').of.length.greaterThan(0)
  })

  it('getPageSource returns outerHTML', async function () {
    const src = await driver.getPageSource(sessionId)
    expect(src).to.contain('<h1>')
    expect(src).to.contain('Hi')
  })

  it('pagePrint returns base64 data', async function () {
    const data = await driver.pagePrint(sessionId, { orientation: 'landscape' })
    expect(data).to.be.a('string').of.length.greaterThan(0)
  })
})
