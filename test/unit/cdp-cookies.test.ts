import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F13 — cookies)', function () {
  this.timeout(10_000)
  const skipOnWindows = process.platform === 'win32'

  let driver: CDPDriver
  let sessionId: string

  beforeEach(async function () {
    if (skipOnWindows) this.skip()
    driver = new CDPDriver({ executablePath: fakeBrowser })
    const session = await driver.startSession('chrome', new Capabilities('chrome' as any))
    sessionId = session.sessionId
    await driver.navigateTo(sessionId, 'https://example.com/')
  })

  afterEach(async function () {
    if (driver && sessionId) await driver.stopSession(sessionId)
  })

  it('cookieCreate + cookieGetAll round-trip', async function () {
    await driver.cookieCreate(sessionId, { name: 'a', value: '1', path: '/' })
    const all = await driver.cookieGetAll(sessionId)
    expect(all).to.deep.include({ name: 'a', value: '1', path: '/' })
  })

  it('cookieGet returns a single cookie by name', async function () {
    await driver.cookieCreate(sessionId, { name: 'b', value: '2' })
    const c = await driver.cookieGet(sessionId, 'b')
    expect(c.name).to.equal('b')
    expect(c.value).to.equal('2')
  })

  it('cookieGet throws for missing cookies', async function () {
    let caught: unknown
    try {
      await driver.cookieGet(sessionId, 'missing')
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).to.match(/No cookie/)
  })

  it('cookieDelete removes a cookie', async function () {
    await driver.cookieCreate(sessionId, { name: 'c', value: '3' })
    await driver.cookieDelete(sessionId, 'c')
    const all = await driver.cookieGetAll(sessionId)
    expect(all.find(c => c.name === 'c')).to.equal(undefined)
  })

  it('cookieDeleteAll wipes the jar', async function () {
    await driver.cookieCreate(sessionId, { name: 'd', value: '4' })
    await driver.cookieDeleteAll(sessionId)
    const all = await driver.cookieGetAll(sessionId)
    expect(all).to.deep.equal([])
  })
})
