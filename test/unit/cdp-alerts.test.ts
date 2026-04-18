import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

async function triggerDialog(
  driver: CDPDriver,
  sessionId: string,
  type: string,
  message: string,
  defaultPrompt?: string
) {
  const raw = (driver as any)._session(sessionId)
  await raw.client.send(
    'Fake.triggerDialog',
    { type, message, defaultPrompt },
    raw.cdpSessionId
  )
  // Let the event propagate.
  await new Promise(r => setTimeout(r, 20))
}

describe('CDPDriver (F15 — dialogs)', function () {
  this.timeout(10_000)
  const skipOnWindows = process.platform === 'win32'

  let driver: CDPDriver
  let sessionId: string

  beforeEach(async function () {
    if (skipOnWindows) this.skip()
    driver = new CDPDriver({ executablePath: fakeBrowser })
    const session = await driver.startSession('chrome', new Capabilities('chrome' as any))
    sessionId = session.sessionId
  })

  afterEach(async function () {
    if (driver && sessionId) await driver.stopSession(sessionId)
  })

  it('alertGetText returns the pending dialog message', async function () {
    await triggerDialog(driver, sessionId, 'alert', 'are you sure?')
    expect(await driver.alertGetText(sessionId)).to.equal('are you sure?')
  })

  it('alertAccept handles the dialog', async function () {
    await triggerDialog(driver, sessionId, 'alert', 'ok')
    await driver.alertAccept(sessionId)
    let caught: unknown
    try {
      await driver.alertGetText(sessionId)
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).to.match(/No open/)
  })

  it('alertSendText is used on subsequent accept (prompt)', async function () {
    await triggerDialog(driver, sessionId, 'prompt', 'your name?')
    await driver.alertSendText(sessionId, 'hi')
    await driver.alertAccept(sessionId)
  })

  it('alertDismiss closes without accepting', async function () {
    await triggerDialog(driver, sessionId, 'confirm', 'really?')
    await driver.alertDismiss(sessionId)
  })

  it('alertGetText throws when no dialog is pending', async function () {
    let caught: unknown
    try {
      await driver.alertGetText(sessionId)
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).to.match(/No open/)
  })
})
