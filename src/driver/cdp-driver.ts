import { randomUUID } from 'crypto'
import { launch, LaunchedBrowser } from '../cdp/browser-launcher.js'
import { CDPClient } from '../cdp/cdp-client.js'
import { ElementRefStore } from '../cdp/element-ref-store.js'
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
  elementRefs: ElementRefStore
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
        timeouts: { ...DEFAULT_TIMEOUTS },
        elementRefs: new ElementRefStore()
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

  async windowGetHandle(sessionId: string): Promise<string> {
    return this._requireSession(sessionId).targetId
  }

  async windowGetHandles(sessionId: string): Promise<string[]> {
    const session = this._requireSession(sessionId)
    const res = await session.client.send<{
      targetInfos: Array<{ targetId: string; type: string }>
    }>('Target.getTargets', {})
    return res.targetInfos
      .filter(t => t.type === 'page')
      .map(t => t.targetId)
  }

  async windowCreate(
    sessionId: string,
    type: 'tab' | 'window'
  ): Promise<WindowCreateResult> {
    const session = this._requireSession(sessionId)
    const res = await session.client.send<{ targetId: string }>(
      'Target.createTarget',
      { url: 'about:blank', newWindow: type === 'window' }
    )
    return { handle: res.targetId, type }
  }

  async windowClose(sessionId: string): Promise<void> {
    const session = this._requireSession(sessionId)
    await session.client.send('Target.closeTarget', {
      targetId: session.targetId
    })
  }

  async windowSwitch(sessionId: string, handle: string): Promise<void> {
    const session = this._requireSession(sessionId)
    if (session.targetId === handle) return
    const attach = await session.client.send<{ sessionId: string }>(
      'Target.attachToTarget',
      { targetId: handle, flatten: true }
    )
    session.targetId = handle
    session.cdpSessionId = attach.sessionId
    session.elementRefs.clear()
    await session.client
      .send('Page.enable', {}, session.cdpSessionId)
      .catch(() => undefined)
    await session.client
      .send('Runtime.enable', {}, session.cdpSessionId)
      .catch(() => undefined)
    await session.client
      .send('DOM.enable', {}, session.cdpSessionId)
      .catch(() => undefined)
    await session.client
      .send('Network.enable', {}, session.cdpSessionId)
      .catch(() => undefined)
  }

  async windowGetRect(sessionId: string): Promise<WindowRect> {
    const session = this._requireSession(sessionId)
    const res = await session.client.send<{
      bounds: { left?: number; top?: number; width?: number; height?: number }
    }>('Browser.getWindowForTarget', { targetId: session.targetId })
    return {
      x: res.bounds.left ?? 0,
      y: res.bounds.top ?? 0,
      width: res.bounds.width ?? 0,
      height: res.bounds.height ?? 0
    }
  }

  async windowSetRect(
    sessionId: string,
    width: number,
    height: number
  ): Promise<WindowRect> {
    return this._setWindowBounds(sessionId, {
      width,
      height,
      windowState: 'normal'
    })
  }

  async windowMaximize(sessionId: string): Promise<WindowRect> {
    return this._setWindowBounds(sessionId, { windowState: 'maximized' })
  }

  async windowMinimize(sessionId: string): Promise<WindowRect> {
    return this._setWindowBounds(sessionId, { windowState: 'minimized' })
  }

  async windowFullscreen(sessionId: string): Promise<WindowRect> {
    return this._setWindowBounds(sessionId, { windowState: 'fullscreen' })
  }

  async frameSwitch(
    sessionId: string,
    frameId: string | number | null
  ): Promise<void> {
    this._requireSession(sessionId)
    if (frameId === null) return
    throw notImpl('frameSwitch(non-null)')
  }

  async frameToParent(sessionId: string): Promise<void> {
    this._requireSession(sessionId)
  }

  private async _setWindowBounds(
    sessionId: string,
    bounds: {
      width?: number
      height?: number
      left?: number
      top?: number
      windowState?: 'normal' | 'minimized' | 'maximized' | 'fullscreen'
    }
  ): Promise<WindowRect> {
    const session = this._requireSession(sessionId)
    const win = await session.client.send<{ windowId: number }>(
      'Browser.getWindowForTarget',
      { targetId: session.targetId }
    )
    await session.client.send('Browser.setWindowBounds', {
      windowId: win.windowId,
      bounds
    })
    return this.windowGetRect(sessionId)
  }

  async findElement(
    sessionId: string,
    using: string,
    value: string
  ): Promise<ElementRef | null> {
    const session = this._requireSession(sessionId)
    const remote = await this._locate(session, null, using, value, false)
    return this._registerRemoteObject(session, remote)
  }

  async findElements(
    sessionId: string,
    using: string,
    value: string
  ): Promise<ElementRef[]> {
    const session = this._requireSession(sessionId)
    const remote = await this._locate(session, null, using, value, true)
    return this._unwrapArray(session, remote)
  }

  async elementFindElement(
    sessionId: string,
    elementId: ElementRef,
    using: string,
    value: string
  ): Promise<ElementRef | null> {
    const session = this._requireSession(sessionId)
    const scope = session.elementRefs.resolve(elementId)
    if (!scope) throw new Error(`Unknown element: ${elementId}`)
    const remote = await this._locate(session, scope.objectId, using, value, false)
    return this._registerRemoteObject(session, remote)
  }

  async elementFindElements(
    sessionId: string,
    elementId: ElementRef,
    using: string,
    value: string
  ): Promise<ElementRef[]> {
    const session = this._requireSession(sessionId)
    const scope = session.elementRefs.resolve(elementId)
    if (!scope) throw new Error(`Unknown element: ${elementId}`)
    const remote = await this._locate(session, scope.objectId, using, value, true)
    return this._unwrapArray(session, remote)
  }

  async getActiveElement(sessionId: string): Promise<ElementRef> {
    const session = this._requireSession(sessionId)
    const res = await session.client.send<{
      result: RemoteObject
    }>(
      'Runtime.evaluate',
      { expression: 'document.activeElement', returnByValue: false },
      session.cdpSessionId
    )
    const uuid = this._registerRemoteObject(session, res.result)
    if (!uuid) throw new Error('No active element on the page')
    return uuid
  }

  private async _locate(
    session: CDPSessionState,
    scopeObjectId: string | null,
    using: string,
    value: string,
    multiple: boolean
  ): Promise<RemoteObject> {
    if (scopeObjectId) {
      const res = await session.client.send<{ result: RemoteObject }>(
        'Runtime.callFunctionOn',
        {
          functionDeclaration: `function(value, using, multiple) { return (${LOCATOR_FN})(value, this, using, multiple) }`,
          objectId: scopeObjectId,
          arguments: [
            { value: value },
            { value: using },
            { value: multiple }
          ],
          returnByValue: false
        },
        session.cdpSessionId
      )
      return res.result
    }
    const res = await session.client.send<{ result: RemoteObject }>(
      'Runtime.evaluate',
      {
        expression: `(${LOCATOR_FN})(${JSON.stringify(value)}, document, ${JSON.stringify(using)}, ${multiple})`,
        returnByValue: false
      },
      session.cdpSessionId
    )
    return res.result
  }

  private _registerRemoteObject(
    session: CDPSessionState,
    remote: RemoteObject
  ): ElementRef | null {
    if (!remote || remote.subtype === 'null' || remote.type !== 'object') return null
    if (!remote.objectId) return null
    return session.elementRefs.register({ objectId: remote.objectId })
  }

  private async _unwrapArray(
    session: CDPSessionState,
    remote: RemoteObject
  ): Promise<ElementRef[]> {
    if (!remote?.objectId) return []
    const props = await session.client.send<{
      result: Array<{ name: string; value?: RemoteObject }>
    }>(
      'Runtime.getProperties',
      { objectId: remote.objectId, ownProperties: true },
      session.cdpSessionId
    )
    const out: ElementRef[] = []
    for (const p of props.result) {
      if (/^\d+$/.test(p.name) && p.value?.objectId) {
        out.push(session.elementRefs.register({ objectId: p.value.objectId }))
      }
    }
    await session.client
      .send(
        'Runtime.releaseObject',
        { objectId: remote.objectId },
        session.cdpSessionId
      )
      .catch(() => undefined)
    return out
  }

  async elementClick(sessionId: string, elementId: ElementRef): Promise<void> {
    const session = this._requireSession(sessionId)
    const scope = this._resolveElement(session, elementId)
    await session.client.send(
      'Runtime.callFunctionOn',
      {
        functionDeclaration: `function() {
          if (typeof this.scrollIntoView === 'function') this.scrollIntoView();
          if (typeof this.click === 'function') { this.click(); return; }
          const r = this.getBoundingClientRect ? this.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
          const x = r.left + r.width / 2, y = r.top + r.height / 2;
          const evt = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y });
          this.dispatchEvent(evt);
        }`,
        objectId: scope.objectId,
        returnByValue: true
      },
      session.cdpSessionId
    )
  }

  async elementClear(sessionId: string, elementId: ElementRef): Promise<void> {
    const session = this._requireSession(sessionId)
    const scope = this._resolveElement(session, elementId)
    await session.client.send(
      'Runtime.callFunctionOn',
      {
        functionDeclaration: `function() {
          if (typeof this.focus === 'function') this.focus();
          if ('value' in this) this.value = '';
          if (this.isContentEditable) this.textContent = '';
          this.dispatchEvent && this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent && this.dispatchEvent(new Event('change', { bubbles: true }));
        }`,
        objectId: scope.objectId,
        returnByValue: true
      },
      session.cdpSessionId
    )
  }

  async elementSendKeys(
    sessionId: string,
    elementId: ElementRef,
    keys: string
  ): Promise<void> {
    const session = this._requireSession(sessionId)
    const scope = this._resolveElement(session, elementId)
    await session.client.send(
      'Runtime.callFunctionOn',
      {
        functionDeclaration: `function(keys) {
          if (typeof this.focus === 'function') this.focus();
          if ('value' in this) {
            this.value = (this.value || '') + keys;
          } else if (this.isContentEditable) {
            this.textContent = (this.textContent || '') + keys;
          } else {
            return;
          }
          this.dispatchEvent && this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent && this.dispatchEvent(new Event('change', { bubbles: true }));
        }`,
        objectId: scope.objectId,
        arguments: [{ value: keys }],
        returnByValue: true
      },
      session.cdpSessionId
    )
  }

  private _resolveElement(session: CDPSessionState, elementId: ElementRef) {
    const scope = session.elementRefs.resolve(elementId)
    if (!scope) throw new Error(`Unknown element: ${elementId}`)
    return scope
  }

  async elementGetAttribute(
    sessionId: string,
    elementId: ElementRef,
    attribute: string
  ): Promise<string> {
    return this._callOnElement<string>(
      sessionId,
      elementId,
      `function(name) { var v = this.getAttribute(name); return v == null ? null : String(v) }`,
      [{ value: attribute }]
    )
  }

  async elementGetProperty(
    sessionId: string,
    elementId: ElementRef,
    property: string
  ): Promise<any> {
    return this._callOnElement<any>(
      sessionId,
      elementId,
      `function(name) { return this[name] }`,
      [{ value: property }]
    )
  }

  async elementGetCss(
    sessionId: string,
    elementId: ElementRef,
    cssProperty: string
  ): Promise<string> {
    return this._callOnElement<string>(
      sessionId,
      elementId,
      `function(prop) {
        var s = window.getComputedStyle(this);
        return s.getPropertyValue ? s.getPropertyValue(prop) : (s[prop] || '');
      }`,
      [{ value: cssProperty }]
    )
  }

  async elementGetText(sessionId: string, elementId: ElementRef): Promise<string> {
    return this._callOnElement<string>(
      sessionId,
      elementId,
      `function() { return (this.innerText != null ? this.innerText : this.textContent) || '' }`,
      []
    )
  }

  async elementGetTagName(sessionId: string, elementId: ElementRef): Promise<string> {
    const name = await this._callOnElement<string>(
      sessionId,
      elementId,
      `function() { return (this.tagName || '').toString() }`,
      []
    )
    return name.toLowerCase()
  }

  async elementGetRect(
    sessionId: string,
    elementId: ElementRef
  ): Promise<WindowRect> {
    return this._callOnElement<WindowRect>(
      sessionId,
      elementId,
      `function() {
        var r = this.getBoundingClientRect();
        return { x: r.x || r.left, y: r.y || r.top, width: r.width, height: r.height };
      }`,
      []
    )
  }

  async elementIsEnabled(sessionId: string, elementId: ElementRef): Promise<boolean> {
    return this._callOnElement<boolean>(
      sessionId,
      elementId,
      `function() { return !this.disabled }`,
      []
    )
  }

  async elementIsSelected(sessionId: string, elementId: ElementRef): Promise<boolean> {
    return this._callOnElement<boolean>(
      sessionId,
      elementId,
      `function() { return !!(this.selected || this.checked) }`,
      []
    )
  }

  async elementScreenshot(
    sessionId: string,
    elementId: ElementRef
  ): Promise<string> {
    const session = this._requireSession(sessionId)
    const scope = this._resolveElement(session, elementId)
    const rect = await this._callOnElement<{
      x: number
      y: number
      width: number
      height: number
    }>(
      sessionId,
      elementId,
      `function() {
        if (this.scrollIntoView) this.scrollIntoView();
        var r = this.getBoundingClientRect();
        return { x: r.x || r.left, y: r.y || r.top, width: r.width, height: r.height };
      }`,
      []
    )
    const res = await session.client.send<{ data: string }>(
      'Page.captureScreenshot',
      {
        clip: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          scale: 1
        },
        captureBeyondViewport: true
      },
      session.cdpSessionId
    )
    void scope // scope is implied by the above callFunctionOn
    return res.data
  }

  private async _callOnElement<T>(
    sessionId: string,
    elementId: ElementRef,
    functionDeclaration: string,
    args: Array<{ value?: unknown; objectId?: string }>
  ): Promise<T> {
    const session = this._requireSession(sessionId)
    const scope = this._resolveElement(session, elementId)
    const res = await session.client.send<{
      result: { value?: T; objectId?: string; type?: string }
      exceptionDetails?: { text: string; exception?: { description?: string } }
    }>(
      'Runtime.callFunctionOn',
      {
        functionDeclaration,
        objectId: scope.objectId,
        arguments: args,
        returnByValue: true
      },
      session.cdpSessionId
    )
    if (res.exceptionDetails) {
      throw new Error(
        `Element call failed: ${
          res.exceptionDetails.exception?.description ?? res.exceptionDetails.text
        }`
      )
    }
    return res.result.value as T
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

interface RemoteObject {
  type: string
  subtype?: string
  objectId?: string
  value?: any
  description?: string
}

/**
 * Shared locator function that runs in the page. Takes the W3C "using"
 * strategy name + value + multiple flag, and returns either a single
 * Element (or null) or an array of Elements. Bound to `scope` parameter.
 */
const LOCATOR_FN = `function(value, scope, using, multiple) {
  scope = scope || document;
  switch (using) {
    case 'css selector':
    case 'tag name':
      return multiple
        ? Array.from(scope.querySelectorAll(value))
        : scope.querySelector(value);
    case 'xpath': {
      if (multiple) {
        var it = document.evaluate(value, scope, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var out = [];
        for (var i = 0; i < it.snapshotLength; i++) out.push(it.snapshotItem(i));
        return out;
      }
      return document.evaluate(value, scope, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    case 'link text': {
      var links = Array.from(scope.querySelectorAll('a'));
      var matches = links.filter(function(a) { return (a.textContent || '').trim() === value; });
      return multiple ? matches : (matches[0] || null);
    }
    case 'partial link text': {
      var links2 = Array.from(scope.querySelectorAll('a'));
      var matches2 = links2.filter(function(a) { return (a.textContent || '').indexOf(value) >= 0; });
      return multiple ? matches2 : (matches2[0] || null);
    }
  }
  return multiple ? [] : null;
}`

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
