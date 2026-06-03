import { Capabilities } from '../capabilities.js'
import { ActionSequence } from '../interface/actions.js'
import { CookieDef } from '../interface/cookie.js'
import { PrintOptions } from '../interface/print.js'
import { SessionDef } from '../interface/session.js'
import { TimeoutsDef } from '../interface/timeouts.js'
import { WindowRect } from '../interface/window-rect.js'

export type ElementRef = string

export interface ProtocolStatus {
  ready: boolean
  message: string
  [key: string]: any
}

export interface WindowCreateResult {
  handle: string
  type: string
}

export interface ProtocolDriver {
  startSession(browser: string, capabilities: Capabilities): Promise<SessionDef>
  stopSession(sessionId: string): Promise<void>
  getStatus(): Promise<ProtocolStatus>

  navigateTo(sessionId: string, url: string): Promise<void>
  navigateBack(sessionId: string): Promise<void>
  navigateForward(sessionId: string): Promise<void>
  navigateRefresh(sessionId: string): Promise<void>
  getCurrentUrl(sessionId: string): Promise<string>
  getTitle(sessionId: string): Promise<string>

  windowGetHandle(sessionId: string): Promise<string>
  windowGetHandles(sessionId: string): Promise<string[]>
  windowCreate(sessionId: string, type: 'tab' | 'window'): Promise<WindowCreateResult>
  windowClose(sessionId: string): Promise<void>
  windowSwitch(sessionId: string, handle: string): Promise<void>
  windowGetRect(sessionId: string): Promise<WindowRect>
  windowSetRect(sessionId: string, width: number, height: number): Promise<WindowRect>
  windowMaximize(sessionId: string): Promise<WindowRect>
  windowMinimize(sessionId: string): Promise<WindowRect>
  windowFullscreen(sessionId: string): Promise<WindowRect>

  frameSwitch(sessionId: string, frameId: string | number | null): Promise<void>
  frameToParent(sessionId: string): Promise<void>

  findElement(
    sessionId: string,
    using: string,
    value: string
  ): Promise<ElementRef | null>
  findElements(sessionId: string, using: string, value: string): Promise<ElementRef[]>
  elementFindElement(
    sessionId: string,
    elementId: ElementRef,
    using: string,
    value: string
  ): Promise<ElementRef | null>
  elementFindElements(
    sessionId: string,
    elementId: ElementRef,
    using: string,
    value: string
  ): Promise<ElementRef[]>
  getActiveElement(sessionId: string): Promise<ElementRef>

  elementClick(sessionId: string, elementId: ElementRef): Promise<void>
  elementClear(sessionId: string, elementId: ElementRef): Promise<void>
  elementSendKeys(sessionId: string, elementId: ElementRef, keys: string): Promise<void>

  elementGetAttribute(
    sessionId: string,
    elementId: ElementRef,
    attribute: string
  ): Promise<string>
  elementGetProperty(
    sessionId: string,
    elementId: ElementRef,
    property: string
  ): Promise<any>
  elementGetCss(
    sessionId: string,
    elementId: ElementRef,
    cssProperty: string
  ): Promise<string>
  elementGetText(sessionId: string, elementId: ElementRef): Promise<string>
  elementGetTagName(sessionId: string, elementId: ElementRef): Promise<string>
  elementGetRect(sessionId: string, elementId: ElementRef): Promise<WindowRect>
  elementIsEnabled(sessionId: string, elementId: ElementRef): Promise<boolean>
  elementIsSelected(sessionId: string, elementId: ElementRef): Promise<boolean>
  elementScreenshot(sessionId: string, elementId: ElementRef): Promise<string>

  executeSync(sessionId: string, script: string, args: any[]): Promise<any>
  executeAsync(sessionId: string, script: string, args: any[]): Promise<any>

  cookieGetAll(sessionId: string): Promise<CookieDef[]>
  cookieGet(sessionId: string, name: string): Promise<CookieDef>
  cookieCreate(sessionId: string, cookie: CookieDef): Promise<void>
  cookieDelete(sessionId: string, name: string): Promise<void>
  cookieDeleteAll(sessionId: string): Promise<void>

  alertAccept(sessionId: string): Promise<void>
  alertDismiss(sessionId: string): Promise<void>
  alertGetText(sessionId: string): Promise<string>
  alertSendText(sessionId: string, text: string): Promise<void>

  timeoutsGet(sessionId: string): Promise<TimeoutsDef>
  timeoutsSet(sessionId: string, timeouts: Partial<TimeoutsDef>): Promise<void>

  screenshot(sessionId: string): Promise<string>
  getPageSource(sessionId: string): Promise<string>
  pagePrint(sessionId: string, options?: PrintOptions): Promise<string>

  actionsPerform(sessionId: string, actions: ActionSequence[]): Promise<void>
  actionsRelease(sessionId: string): Promise<void>
}
