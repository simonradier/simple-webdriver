import { randomUUID } from 'crypto'
import { launch, LaunchedBrowser } from '../cdp/browser-launcher.js'
import { CDPClient } from '../cdp/cdp-client.js'
import { CDPNotImplementedError } from '../cdp/errors.js'
import { CDPOptions } from '../cdp/options.js'
import { Capabilities } from '../capabilities.js'
import { ActionSequence } from '../interface/actions.js'
import { CookieDef } from '../interface/cookie.js'
import { PrintOptions } from '../interface/print.js'
import { SessionDef } from '../interface/session.js'
import { TimeoutsDef } from '../interface/timeouts.js'
import { WindowRect } from '../interface/window-rect.js'
import { Logger } from '../utils/logger.js'
import {
  ElementRef,
  ProtocolDriver,
  ProtocolStatus,
  WindowCreateResult
} from './protocol-driver.js'

interface CDPSessionState {
  launched: LaunchedBrowser
  client: CDPClient
  targetId: string
  cdpSessionId: string
  browserVersion: string
  timeouts: TimeoutsDef
}

const DEFAULT_TIMEOUTS: TimeoutsDef = {
  implicit: 0,
  pageLoad: 300_000,
  script: 30_000
}

export class CDPDriver implements ProtocolDriver {
  private readonly _options: CDPOptions
  private readonly _sessions = new Map<string, CDPSessionState>()

  constructor(options: CDPOptions = {}) {
    this._options = options
  }

  /** @internal — exposed for diagnostics/tests only. */
  get openSessionCount(): number {
    return this._sessions.size
  }

  async startSession(browser: string, _capabilities: Capabilities): Promise<SessionDef> {
    void _capabilities
    const launched = await launch(this._options)
    const client = new CDPClient(launched.wsEndpoint)
    try {
      await client.connect()
      const target = await client.send<{ targetId: string }>('Target.createTarget', {
        url: 'about:blank'
      })
      const attach = await client.send<{ sessionId: string }>('Target.attachToTarget', {
        targetId: target.targetId,
        flatten: true
      })
      await client.send('Page.enable', {}, attach.sessionId)
      await client.send('Runtime.enable', {}, attach.sessionId)
      await client.send('DOM.enable', {}, attach.sessionId)
      await client.send('Network.enable', {}, attach.sessionId)

      const versionInfo = await fetchBrowserVersion(launched.debugUrl)
      const externalId = randomUUID()
      this._sessions.set(externalId, {
        launched,
        client,
        targetId: target.targetId,
        cdpSessionId: attach.sessionId,
        browserVersion: versionInfo.Browser ?? 'unknown',
        timeouts: { ...DEFAULT_TIMEOUTS }
      })
      return buildSessionDef(externalId, browser, versionInfo.Browser, launched.userDataDir)
    } catch (err) {
      await client.close().catch(() => {})
      await launched.close().catch(() => {})
      throw err
    }
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this._sessions.get(sessionId)
    if (!session) return
    this._sessions.delete(sessionId)
    try {
      await session.client.send('Target.closeTarget', {
        targetId: session.targetId
      })
    } catch (e) {
      Logger.debug(`CDP stopSession: Target.closeTarget failed: ${String(e)}`)
    }
    await session.client.close().catch(() => {})
    await session.launched.close().catch(() => {})
  }

  async getStatus(): Promise<ProtocolStatus> {
    return {
      ready: true,
      message: 'CDP driver ready',
      openSessions: this._sessions.size
    }
  }

  // Everything below is NOT implemented yet — filled in by F7…F17.

  async navigateTo(sessionId: string, url: string): Promise<void> {
    const session = this._requireSession(sessionId)
    const loaded = waitForFrameStopped(session)
    const res = await session.client.send<{
      frameId: string
      errorText?: string
    }>('Page.navigate', { url }, session.cdpSessionId)
    if (res.errorText) throw new Error(`Navigation failed: ${res.errorText}`)
    await loaded
  }

  async navigateBack(sessionId: string): Promise<void> {
    await this._navigateHistory(sessionId, -1)
  }

  async navigateForward(sessionId: string): Promise<void> {
    await this._navigateHistory(sessionId, 1)
  }

  async navigateRefresh(sessionId: string): Promise<void> {
    const session = this._requireSession(sessionId)
    const loaded = waitForFrameStopped(session)
    await session.client.send('Page.reload', {}, session.cdpSessionId)
    await loaded
  }

  async getCurrentUrl(sessionId: string): Promise<string> {
    return this._evalString(sessionId, 'window.location.href')
  }

  async getTitle(sessionId: string): Promise<string> {
    return this._evalString(sessionId, 'document.title')
  }

  private async _navigateHistory(sessionId: string, direction: -1 | 1): Promise<void> {
    const session = this._requireSession(sessionId)
    const history = await session.client.send<{
      currentIndex: number
      entries: { id: number }[]
    }>('Page.getNavigationHistory', {}, session.cdpSessionId)
    const target = history.currentIndex + direction
    if (target < 0 || target >= history.entries.length) return
    const entryId = history.entries[target].id
    const loaded = waitForFrameStopped(session)
    await session.client.send(
      'Page.navigateToHistoryEntry',
      { entryId },
      session.cdpSessionId
    )
    await loaded
  }

  private async _evalString(sessionId: string, expression: string): Promise<string> {
    const session = this._requireSession(sessionId)
    const res = await session.client.send<{
      result: { type: string; value?: any }
    }>(
      'Runtime.evaluate',
      { expression, returnByValue: true },
      session.cdpSessionId
    )
    return typeof res.result.value === 'string' ? res.result.value : ''
  }

  async windowGetHandle(_s: string): Promise<string> {
    throw notImpl('windowGetHandle')
  }
  async windowGetHandles(_s: string): Promise<string[]> {
    throw notImpl('windowGetHandles')
  }
  async windowCreate(_s: string, _t: 'tab' | 'window'): Promise<WindowCreateResult> {
    throw notImpl('windowCreate')
  }
  async windowClose(_s: string): Promise<void> {
    throw notImpl('windowClose')
  }
  async windowSwitch(_s: string, _h: string): Promise<void> {
    throw notImpl('windowSwitch')
  }
  async windowGetRect(_s: string): Promise<WindowRect> {
    throw notImpl('windowGetRect')
  }
  async windowSetRect(_s: string, _w: number, _h: number): Promise<WindowRect> {
    throw notImpl('windowSetRect')
  }
  async windowMaximize(_s: string): Promise<WindowRect> {
    throw notImpl('windowMaximize')
  }
  async windowMinimize(_s: string): Promise<WindowRect> {
    throw notImpl('windowMinimize')
  }
  async windowFullscreen(_s: string): Promise<WindowRect> {
    throw notImpl('windowFullscreen')
  }

  async frameSwitch(_s: string, _f: string | number | null): Promise<void> {
    throw notImpl('frameSwitch')
  }
  async frameToParent(_s: string): Promise<void> {
    throw notImpl('frameToParent')
  }

  async findElement(_s: string, _u: string, _v: string): Promise<ElementRef | null> {
    throw notImpl('findElement')
  }
  async findElements(_s: string, _u: string, _v: string): Promise<ElementRef[]> {
    throw notImpl('findElements')
  }
  async elementFindElement(
    _s: string,
    _e: ElementRef,
    _u: string,
    _v: string
  ): Promise<ElementRef | null> {
    throw notImpl('elementFindElement')
  }
  async elementFindElements(
    _s: string,
    _e: ElementRef,
    _u: string,
    _v: string
  ): Promise<ElementRef[]> {
    throw notImpl('elementFindElements')
  }
  async getActiveElement(_s: string): Promise<ElementRef> {
    throw notImpl('getActiveElement')
  }

  async elementClick(_s: string, _e: ElementRef): Promise<void> {
    throw notImpl('elementClick')
  }
  async elementClear(_s: string, _e: ElementRef): Promise<void> {
    throw notImpl('elementClear')
  }
  async elementSendKeys(_s: string, _e: ElementRef, _k: string): Promise<void> {
    throw notImpl('elementSendKeys')
  }

  async elementGetAttribute(
    _s: string,
    _e: ElementRef,
    _a: string
  ): Promise<string> {
    throw notImpl('elementGetAttribute')
  }
  async elementGetProperty(_s: string, _e: ElementRef, _p: string): Promise<any> {
    throw notImpl('elementGetProperty')
  }
  async elementGetCss(_s: string, _e: ElementRef, _p: string): Promise<string> {
    throw notImpl('elementGetCss')
  }
  async elementGetText(_s: string, _e: ElementRef): Promise<string> {
    throw notImpl('elementGetText')
  }
  async elementGetTagName(_s: string, _e: ElementRef): Promise<string> {
    throw notImpl('elementGetTagName')
  }
  async elementGetRect(_s: string, _e: ElementRef): Promise<WindowRect> {
    throw notImpl('elementGetRect')
  }
  async elementIsEnabled(_s: string, _e: ElementRef): Promise<boolean> {
    throw notImpl('elementIsEnabled')
  }
  async elementIsSelected(_s: string, _e: ElementRef): Promise<boolean> {
    throw notImpl('elementIsSelected')
  }
  async elementScreenshot(_s: string, _e: ElementRef): Promise<string> {
    throw notImpl('elementScreenshot')
  }

  async executeSync(sessionId: string, script: string, args: any[]): Promise<any> {
    return this._runScript(sessionId, script, args, false)
  }
  async executeAsync(sessionId: string, script: string, args: any[]): Promise<any> {
    return this._runScript(sessionId, script, args, true)
  }

  private async _runScript(
    sessionId: string,
    script: string,
    args: any[],
    awaitPromise: boolean
  ): Promise<any> {
    const session = this._requireSession(sessionId)
    // Element refs are not yet resolved — that plumbing lands with F9.
    // For now any arg that looks like a W3C element wrapper is passed as
    // a plain object, which will not be a live DOM node in the page.
    const expression = `(function() {${script}}).apply(null, ${JSON.stringify(args)})`
    const res = await session.client.send<{
      result: { value?: any }
      exceptionDetails?: { text: string; exception?: { description?: string } }
    }>(
      'Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise },
      session.cdpSessionId
    )
    if (res.exceptionDetails) {
      const msg =
        res.exceptionDetails.exception?.description ?? res.exceptionDetails.text
      throw new Error(`Script error: ${msg}`)
    }
    return res.result?.value
  }

  async cookieGetAll(_s: string): Promise<CookieDef[]> {
    throw notImpl('cookieGetAll')
  }
  async cookieGet(_s: string, _n: string): Promise<CookieDef> {
    throw notImpl('cookieGet')
  }
  async cookieCreate(_s: string, _c: CookieDef): Promise<void> {
    throw notImpl('cookieCreate')
  }
  async cookieDelete(_s: string, _n: string): Promise<void> {
    throw notImpl('cookieDelete')
  }
  async cookieDeleteAll(_s: string): Promise<void> {
    throw notImpl('cookieDeleteAll')
  }

  async alertAccept(_s: string): Promise<void> {
    throw notImpl('alertAccept')
  }
  async alertDismiss(_s: string): Promise<void> {
    throw notImpl('alertDismiss')
  }
  async alertGetText(_s: string): Promise<string> {
    throw notImpl('alertGetText')
  }
  async alertSendText(_s: string, _t: string): Promise<void> {
    throw notImpl('alertSendText')
  }

  async timeoutsGet(sessionId: string): Promise<TimeoutsDef> {
    const session = this._requireSession(sessionId)
    return { ...session.timeouts }
  }
  async timeoutsSet(
    sessionId: string,
    timeouts: Partial<TimeoutsDef>
  ): Promise<void> {
    const session = this._requireSession(sessionId)
    session.timeouts = { ...session.timeouts, ...timeouts }
  }

  async screenshot(_s: string): Promise<string> {
    throw notImpl('screenshot')
  }
  async getPageSource(_s: string): Promise<string> {
    throw notImpl('getPageSource')
  }
  async pagePrint(_s: string, _o?: PrintOptions): Promise<string> {
    throw notImpl('pagePrint')
  }

  async actionsPerform(_s: string, _a: ActionSequence[]): Promise<void> {
    throw notImpl('actionsPerform')
  }
  async actionsRelease(_s: string): Promise<void> {
    throw notImpl('actionsRelease')
  }

  /** @internal */
  _session(sessionId: string): CDPSessionState | undefined {
    return this._sessions.get(sessionId)
  }

  private _requireSession(sessionId: string): CDPSessionState {
    const s = this._sessions.get(sessionId)
    if (!s) throw new Error(`Unknown session id: ${sessionId}`)
    return s
  }
}

function notImpl(method: string): CDPNotImplementedError {
  return new CDPNotImplementedError(
    `CDPDriver.${method} is not yet implemented — landing incrementally in F7-F17`
  )
}

function waitForFrameStopped(session: CDPSessionState): Promise<void> {
  return new Promise<void>(resolve => {
    const off = session.client.on('Page.frameStoppedLoading', evt => {
      if (evt.sessionId === session.cdpSessionId) {
        off()
        clearTimeout(timer)
        resolve()
      }
    })
    const timer = setTimeout(() => {
      off()
      resolve()
    }, session.timeouts.pageLoad)
  })
}

async function fetchBrowserVersion(
  debugUrl: string
): Promise<{ Browser?: string; [k: string]: any }> {
  const res = await fetch(`${debugUrl}/json/version`, {
    signal: AbortSignal.timeout(3_000)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching /json/version`)
  return (await res.json()) as { Browser?: string; [k: string]: any }
}

function buildSessionDef(
  externalId: string,
  browser: string,
  browserVersion: string | undefined,
  userDataDir: string
): SessionDef {
  return {
    sessionId: externalId,
    capabilities: {
      acceptInsecureCerts: false,
      browserName: browser,
      browserVersion: browserVersion ?? 'unknown',
      chrome: {
        chromedriverVersion: '',
        userDataDir
      },
      networkConnectionEnabled: true,
      pageLoadStrategy: 'normal',
      platformName: process.platform,
      proxy: {},
      setWindowRect: true,
      strictFileInteractability: false,
      timeouts: { ...DEFAULT_TIMEOUTS },
      unhandledPromptBehavior: 'dismiss and notify',
      'webauthn:virtualAuthenticators': true
    }
  }
}
