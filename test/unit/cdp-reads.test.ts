import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F11 — element property reads)', function () {
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
              {
                tag: 'h1',
                attrs: { id: 'title', class: 'big', _style: { color: 'red' } },
                text: 'Hello'
              },
              {
                tag: 'input',
                attrs: { id: 'in', value: 'v', disabled: '', checked: 'true' }
              }
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

  it('getText returns the rendered text', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    expect(await driver.elementGetText(sessionId, h1!)).to.equal('Hello')
  })

  it('getAttribute returns a stored attribute', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    expect(await driver.elementGetAttribute(sessionId, h1!, 'class')).to.equal('big')
  })

  it('getAttribute returns null for missing attributes', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    const r = await driver.elementGetAttribute(sessionId, h1!, 'data-none')
    expect(r).to.equal(null)
  })

  it('getProperty reads a live property', async function () {
    const input = await driver.findElement(sessionId, 'css selector', '#in')
    expect(await driver.elementGetProperty(sessionId, input!, 'value')).to.equal('v')
  })

  it('getTagName returns lowercase', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    expect(await driver.elementGetTagName(sessionId, h1!)).to.equal('h1')
  })

  it('getCSSValue reads computed style', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    expect(await driver.elementGetCss(sessionId, h1!, 'color')).to.equal('red')
  })

  it('getRect returns x/y/width/height', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    const r = await driver.elementGetRect(sessionId, h1!)
    expect(r).to.include.keys('x', 'y', 'width', 'height')
  })

  it('isEnabled reflects disabled attribute', async function () {
    const input = await driver.findElement(sessionId, 'css selector', '#in')
    expect(await driver.elementIsEnabled(sessionId, input!)).to.equal(false)
  })

  it('isSelected reflects checked/selected', async function () {
    const input = await driver.findElement(sessionId, 'css selector', '#in')
    expect(await driver.elementIsSelected(sessionId, input!)).to.equal(true)
  })

  it('elementScreenshot returns a base64 string', async function () {
    const h1 = await driver.findElement(sessionId, 'css selector', '#title')
    const shot = await driver.elementScreenshot(sessionId, h1!)
    expect(shot).to.be.a('string').of.length.greaterThan(0)
  })
})
