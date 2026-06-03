import { expect } from 'chai'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPDriver } from '../../src/driver/cdp-driver.js'
import { Capabilities } from '../../src/capabilities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fakeBrowser = path.resolve(__dirname, '../fixtures/fake-browser.mjs')

describe('CDPDriver (F16 — actions)', function () {
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

  it('actionsPerform handles a pointer + key sequence without throwing', async function () {
    await driver.actionsPerform(sessionId, [
      {
        type: 'pointer',
        id: 'mouse1',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', x: 10, y: 20, duration: 0 },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 5 },
          { type: 'pointerUp', button: 0 }
        ]
      },
      {
        type: 'key',
        id: 'kb1',
        actions: [
          { type: 'keyDown', value: 'a' },
          { type: 'keyUp', value: 'a' }
        ]
      }
    ])
  })

  it('actionsRelease is a no-op', async function () {
    await driver.actionsRelease(sessionId)
  })

  it('actionsPerform handles a wheel action', async function () {
    await driver.actionsPerform(sessionId, [
      {
        type: 'wheel',
        id: 'wheel1',
        actions: [{ type: 'scroll', x: 0, y: 0, deltaX: 0, deltaY: 100 }]
      }
    ])
  })
})
