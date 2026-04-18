import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F9 — find elements)', function () {
  this.timeout(10_000)
  const skipOnWindows = process.platform === 'win32'

  let driver: CDPDriver
  let sessionId: string

  beforeEach(async function () {
    if (skipOnWindows) this.skip()
    driver = new CDPDriver({ executablePath: fakeBrowser })
    const session = await driver.startSession('chrome', new Capabilities('chrome' as any))
    sessionId = session.sessionId
    // Prime the fake DOM via the Fake.setup test hook.
    const raw = (driver as any)._session(sessionId)
    await raw.client.send(
      'Fake.setup',
      {
        elements: [
          {
            tag: 'body',
            children: [
              { tag: 'h1', attrs: { id: 'title' }, text: 'Hello' },
              { tag: 'a', attrs: { class: 'link', href: '/go' }, text: 'Open' },
              { tag: 'a', attrs: { class: 'link' }, text: 'Open more' }
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

  it('findElement by CSS returns a UUID', async function () {
    const id = await driver.findElement(sessionId, 'css selector', 'h1')
    expect(id).to.be.a('string').of.length.greaterThan(0)
  })

  it('findElement returns null when nothing matches', async function () {
    const id = await driver.findElement(sessionId, 'css selector', '.missing')
    expect(id).to.equal(null)
  })

  it('findElements returns all matches as an array of UUIDs', async function () {
    const ids = await driver.findElements(sessionId, 'css selector', '.link')
    expect(ids).to.be.an('array').of.length(2)
    expect(ids[0]).to.be.a('string')
  })

  it('findElements returns an empty array when nothing matches', async function () {
    const ids = await driver.findElements(sessionId, 'css selector', '.nope')
    expect(ids).to.deep.equal([])
  })

  it('elementFindElement scopes the search', async function () {
    const body = await driver.findElement(sessionId, 'tag name', 'body')
    expect(body).to.be.a('string')
    const a = await driver.elementFindElement(
      sessionId,
      body!,
      'css selector',
      '.link'
    )
    expect(a).to.be.a('string').of.length.greaterThan(0)
  })
})
