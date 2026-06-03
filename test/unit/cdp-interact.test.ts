import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F10 — element interactions)', function () {
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
            tag: 'body',
            children: [
              { tag: 'button', attrs: { id: 'btn' }, text: 'Click me' },
              { tag: 'input', attrs: { id: 'in', value: 'hi' } }
            ]
          }
        ]
      },
      raw.cdpSessionId
    )
  })

  afterEach(async function () {
    if (driver && sessionId) await driver.stopSession(sessionId)
  })

  it('elementClick invokes the element click handler', async function () {
    const btn = await driver.findElement(sessionId, 'css selector', '#btn')
    await driver.elementClick(sessionId, btn!)
    // Verify the fake element registered a click via script:
    const clicks = await driver.executeSync(
      sessionId,
      "return document.querySelector('#btn')._clicked;",
      []
    )
    expect(clicks).to.equal(1)
  })

  it('elementClear empties a value', async function () {
    const input = await driver.findElement(sessionId, 'css selector', '#in')
    await driver.elementClear(sessionId, input!)
    const val = await driver.executeSync(
      sessionId,
      "return document.querySelector('#in').value;",
      []
    )
    expect(val).to.equal('')
  })

  it('elementSendKeys appends to the value', async function () {
    const input = await driver.findElement(sessionId, 'css selector', '#in')
    await driver.elementSendKeys(sessionId, input!, ' there')
    const val = await driver.executeSync(
      sessionId,
      "return document.querySelector('#in').value;",
      []
    )
    expect(val).to.equal('hi there')
  })
})
