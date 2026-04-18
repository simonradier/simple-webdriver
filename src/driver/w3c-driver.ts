import * as wdapi from '../api.js'
import { W3C } from '../api/w3c.js'
import { Capabilities } from '../capabilities.js'
import { WebDriverResponseError } from '../error.js'
import { ActionSequence } from '../interface/actions.js'
import { CookieDef } from '../interface/cookie.js'
import { ElementDef } from '../interface/element.js'
import { PrintOptions } from '../interface/print.js'
import { SessionDef } from '../interface/session.js'
import { TimeoutsDef } from '../interface/timeouts.js'
import { WindowRect } from '../interface/window-rect.js'
import {
  ElementRef,
  ProtocolDriver,
  ProtocolStatus,
  WindowCreateResult
} from './protocol-driver.js'

const W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

function isNotFound(err: unknown): boolean {
  if (err instanceof WebDriverResponseError) {
    const status = err.httpResponse?.statusCode
    return status === 404
  }
  return false
}

function extractElementId(value: unknown): ElementRef | null {
  if (!value || typeof value !== 'object') return null
  const id = (value as ElementDef)[W3C_ELEMENT_KEY]
  return typeof id === 'string' ? id : null
}

function normalizeElementList(
  raw: ElementDef[] | ElementDef | null | undefined
): ElementRef[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map(extractElementId).filter((id): id is string => id !== null)
  }
  const id = extractElementId(raw)
  return id ? [id] : []
}

export class W3CDriver implements ProtocolDriver {
  private readonly _api = new W3C()
  public readonly serverUrl: URL

  constructor(serverUrl: URL) {
    this.serverUrl = serverUrl
  }

  private async _value<T>(request: ReturnType<W3C[keyof W3C]>): Promise<T> {
    const resp = await wdapi.call<T>(this.serverUrl, request as any)
    return resp.body.value
  }

  async startSession(browser: string, capabilities: Capabilities): Promise<SessionDef> {
    return this._value<SessionDef>(this._api.SESSION_START(browser, capabilities))
  }

  async stopSession(sessionId: string): Promise<void> {
    await this._value<void>(this._api.SESSION_STOP(sessionId))
  }

  async getStatus(): Promise<ProtocolStatus> {
    return this._value<ProtocolStatus>(this._api.STATUS())
  }

  async navigateTo(sessionId: string, url: string): Promise<void> {
    await this._value<void>(this._api.NAVIGATE_TO(sessionId, url))
  }

  async navigateBack(sessionId: string): Promise<void> {
    await this._value<void>(this._api.NAVIGATE_BACK(sessionId))
  }

  async navigateForward(sessionId: string): Promise<void> {
    await this._value<void>(this._api.NAVIGATE_FORWARD(sessionId))
  }

  async navigateRefresh(sessionId: string): Promise<void> {
    await this._value<void>(this._api.NAVIGATE_REFRESH(sessionId))
  }

  async getCurrentUrl(sessionId: string): Promise<string> {
    return this._value<string>(this._api.NAVIGATE_CURRENTURL(sessionId))
  }

  async getTitle(sessionId: string): Promise<string> {
    return this._value<string>(this._api.GETTITLE(sessionId))
  }

  async windowGetHandle(sessionId: string): Promise<string> {
    return this._value<string>(this._api.WINDOW_GETHANDLE(sessionId))
  }

  async windowGetHandles(sessionId: string): Promise<string[]> {
    return this._value<string[]>(this._api.WINDOW_GETHANDLES(sessionId))
  }

  async windowCreate(
    sessionId: string,
    type: 'tab' | 'window'
  ): Promise<WindowCreateResult> {
    return this._value<WindowCreateResult>(this._api.WINDOW_CREATE(sessionId, type))
  }

  async windowClose(sessionId: string): Promise<void> {
    await this._value<void>(this._api.WINDOW_CLOSE(sessionId))
  }

  async windowSwitch(sessionId: string, handle: string): Promise<void> {
    await this._value<void>(this._api.WINDOW_SWITCH(sessionId, handle))
  }

  async windowGetRect(sessionId: string): Promise<WindowRect> {
    return this._value<WindowRect>(this._api.WINDOW_GETRECT(sessionId))
  }

  async windowSetRect(
    sessionId: string,
    width: number,
    height: number
  ): Promise<WindowRect> {
    return this._value<WindowRect>(this._api.WINDOW_SETRECT(sessionId, width, height))
  }

  async windowMaximize(sessionId: string): Promise<WindowRect> {
    return this._value<WindowRect>(this._api.WINDOW_MAXIMIZE(sessionId))
  }

  async windowMinimize(sessionId: string): Promise<WindowRect> {
    return this._value<WindowRect>(this._api.WINDOW_MINIMIZE(sessionId))
  }

  async windowFullscreen(sessionId: string): Promise<WindowRect> {
    return this._value<WindowRect>(this._api.WINDOW_FULLSCREEN(sessionId))
  }

  async frameSwitch(sessionId: string, frameId: string | number | null): Promise<void> {
    await this._value<void>(this._api.FRAME_SWITCH(sessionId, frameId))
  }

  async frameToParent(sessionId: string): Promise<void> {
    await this._value<void>(this._api.FRAME_TOPARENT(sessionId))
  }

  async findElement(
    sessionId: string,
    using: string,
    value: string
  ): Promise<ElementRef | null> {
    try {
      const raw = await this._value<ElementDef | null>(
        this._api.FINDELEMENT(sessionId, using, value)
      )
      return extractElementId(raw)
    } catch (e) {
      if (isNotFound(e)) return null
      throw e
    }
  }

  async findElements(
    sessionId: string,
    using: string,
    value: string
  ): Promise<ElementRef[]> {
    try {
      const raw = await this._value<ElementDef[] | ElementDef | null>(
        this._api.FINDELEMENTS(sessionId, using, value)
      )
      return normalizeElementList(raw)
    } catch (e) {
      if (isNotFound(e)) return []
      throw e
    }
  }

  async elementFindElement(
    sessionId: string,
    elementId: ElementRef,
    using: string,
    value: string
  ): Promise<ElementRef | null> {
    try {
      const raw = await this._value<ElementDef | null>(
        this._api.ELEMENT_FINDELEMENT(sessionId, elementId, using, value)
      )
      return extractElementId(raw)
    } catch (e) {
      if (isNotFound(e)) return null
      throw e
    }
  }

  async elementFindElements(
    sessionId: string,
    elementId: ElementRef,
    using: string,
    value: string
  ): Promise<ElementRef[]> {
    try {
      const raw = await this._value<ElementDef[] | ElementDef | null>(
        this._api.ELEMENT_FINDELEMENTS(sessionId, elementId, using, value)
      )
      return normalizeElementList(raw)
    } catch (e) {
      if (isNotFound(e)) return []
      throw e
    }
  }

  async getActiveElement(sessionId: string): Promise<ElementRef> {
    const raw = await this._value<ElementDef>(this._api.GETACTIVEELEMENT(sessionId))
    const id = extractElementId(raw)
    if (!id) throw new Error('No active element returned by server')
    return id
  }

  async elementClick(sessionId: string, elementId: ElementRef): Promise<void> {
    await this._value<void>(this._api.ELEMENT_CLICK(sessionId, elementId))
  }

  async elementClear(sessionId: string, elementId: ElementRef): Promise<void> {
    await this._value<void>(this._api.ELEMENT_CLEAR(sessionId, elementId))
  }

  async elementSendKeys(
    sessionId: string,
    elementId: ElementRef,
    keys: string
  ): Promise<void> {
    await this._value<void>(this._api.ELEMENT_SENDKEYS(sessionId, elementId, keys))
  }

  async elementGetAttribute(
    sessionId: string,
    elementId: ElementRef,
    attribute: string
  ): Promise<string> {
    return this._value<string>(
      this._api.ELEMENT_GETATTRIBUTE(sessionId, elementId, attribute)
    )
  }

  async elementGetProperty(
    sessionId: string,
    elementId: ElementRef,
    property: string
  ): Promise<any> {
    return this._value<any>(this._api.ELEMENT_GETPROPERTY(sessionId, elementId, property))
  }

  async elementGetCss(
    sessionId: string,
    elementId: ElementRef,
    cssProperty: string
  ): Promise<string> {
    return this._value<string>(
      this._api.ELEMENT_GETCSS(sessionId, elementId, cssProperty)
    )
  }

  async elementGetText(sessionId: string, elementId: ElementRef): Promise<string> {
    return this._value<string>(this._api.ELEMENT_GETTEXT(sessionId, elementId))
  }

  async elementGetTagName(sessionId: string, elementId: ElementRef): Promise<string> {
    return this._value<string>(this._api.ELEMENT_GETTAGNAME(sessionId, elementId))
  }

  async elementGetRect(sessionId: string, elementId: ElementRef): Promise<WindowRect> {
    return this._value<WindowRect>(this._api.ELEMENT_GETRECT(sessionId, elementId))
  }

  async elementIsEnabled(sessionId: string, elementId: ElementRef): Promise<boolean> {
    return this._value<boolean>(this._api.ELEMENT_ISENABLED(sessionId, elementId))
  }

  async elementIsSelected(sessionId: string, elementId: ElementRef): Promise<boolean> {
    return this._value<boolean>(this._api.ELEMENT_ISSELECTED(sessionId, elementId))
  }

  async elementScreenshot(sessionId: string, elementId: ElementRef): Promise<string> {
    return this._value<string>(this._api.ELEMENT_SCREENSHOT(sessionId, elementId))
  }

  async executeSync(sessionId: string, script: string, args: any[]): Promise<any> {
    return this._value<any>(this._api.EXECUTE_SYNC(sessionId, script, args))
  }

  async executeAsync(sessionId: string, script: string, args: any[]): Promise<any> {
    return this._value<any>(this._api.EXECUTE_ASYNC(sessionId, script, args))
  }

  async cookieGetAll(sessionId: string): Promise<CookieDef[]> {
    return this._value<CookieDef[]>(this._api.COOKIE_GETALL(sessionId))
  }

  async cookieGet(sessionId: string, name: string): Promise<CookieDef> {
    return this._value<CookieDef>(this._api.COOKIE_GET(sessionId, name))
  }

  async cookieCreate(sessionId: string, cookie: CookieDef): Promise<void> {
    await this._value<void>(this._api.COOKIE_CREATE(sessionId, cookie))
  }

  async cookieDelete(sessionId: string, name: string): Promise<void> {
    await this._value<void>(this._api.COOKIE_DELETE(sessionId, name))
  }

  async cookieDeleteAll(sessionId: string): Promise<void> {
    await this._value<void>(this._api.COOKIE_DELETEALL(sessionId))
  }

  async alertAccept(sessionId: string): Promise<void> {
    await this._value<void>(this._api.ALERT_ACCEPT(sessionId))
  }

  async alertDismiss(sessionId: string): Promise<void> {
    await this._value<void>(this._api.ALERT_DISMISS(sessionId))
  }

  async alertGetText(sessionId: string): Promise<string> {
    return this._value<string>(this._api.ALERT_GETTEXT(sessionId))
  }

  async alertSendText(sessionId: string, text: string): Promise<void> {
    await this._value<void>(this._api.ALERT_SENDTEXT(sessionId, text))
  }

  async timeoutsGet(sessionId: string): Promise<TimeoutsDef> {
    return this._value<TimeoutsDef>(this._api.TIMEOUTS_GET(sessionId))
  }

  async timeoutsSet(sessionId: string, timeouts: Partial<TimeoutsDef>): Promise<void> {
    await this._value<void>(this._api.TIMEOUTS_SET(sessionId, timeouts))
  }

  async screenshot(sessionId: string): Promise<string> {
    return this._value<string>(this._api.SCREENSHOT(sessionId))
  }

  async getPageSource(sessionId: string): Promise<string> {
    return this._value<string>(this._api.PAGESOURCE_GET(sessionId))
  }

  async pagePrint(sessionId: string, options?: PrintOptions): Promise<string> {
    return this._value<string>(this._api.PAGE_PRINT(sessionId, options))
  }

  async actionsPerform(sessionId: string, actions: ActionSequence[]): Promise<void> {
    await this._value<void>(this._api.ACTIONS_PERFORM(sessionId, actions))
  }

  async actionsRelease(sessionId: string): Promise<void> {
    await this._value<void>(this._api.ACTIONS_RELEASE(sessionId))
  }
}
