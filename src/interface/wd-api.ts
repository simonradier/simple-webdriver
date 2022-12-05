import { CookieDef } from '../interface'
import { RequestDef } from './request'

export interface WDAPIDef {
  SESSION_START(browser: string, args: string[]): RequestDef
  SESSION_STOP(sessionId: string): RequestDef
  NAVIGATE_CURRENTURL(sessionId: string): RequestDef
  NAVIGATE_TO(sessionId: string, url: string): RequestDef
  NAVIGATE_REFRESH(sessionId: string): RequestDef
  NAVIGATE_BACK(sessionId: string): RequestDef
  NAVIGATE_FORWARD(sessionId: string): RequestDef
  WINDOW_CREATE(sessionId: string, type: 'tab' | 'window'): RequestDef
  GETTITLE(sessionId: string): RequestDef
  WINDOW_GETHANDLE(sessionId: string): RequestDef
  WINDOW_GETHANDLES(sessionId: string): RequestDef
  WINDOW_SETRECT(sessionId: string, width: number, height: number): RequestDef
  WINDOW_GETRECT(sessionId: string): RequestDef
  WINDOW_MAXIMIZE(sessionId: string): RequestDef
  WINDOW_MINIMIZE(sessionId: string): RequestDef
  WINDOW_FULLSCREEN(sessionId: string): RequestDef
  WINDOW_CLOSE(sessionId: string): RequestDef
  WINDOW_SWITCH(sessionId: string, handle: string): RequestDef
  SCREENSHOT(sessionId: string): RequestDef
  FRAME_SWITCH(sessionId: string, frameId: string | number | null): RequestDef
  FRAME_TOPARENT(sessionId: string): RequestDef
  FINDELEMENT(sessionId: string, using: string, value: string): RequestDef
  FINDELEMENTS(sessionId: string, using: string, value: string): RequestDef
  GETACTIVEELEMENT(sessionId: string): RequestDef
  ELEMENT_FINDELEMENT(
    sessionId: string,
    element: string,
    using: string,
    value: string
  ): RequestDef
  ELEMENT_FINDELEMENTS(
    sessionId: string,
    element: string,
    using: string,
    value: string
  ): RequestDef
  ELEMENT_GETATTRIBUTE(sessionId: string, element: string, attribute: string): RequestDef
  ELEMENT_GETPROPERTY(sessionId: string, element: string, property: string): RequestDef
  ELEMENT_GETCSS(sessionId: string, element: string, cssProperty: string): RequestDef
  ELEMENT_GETTEXT(sessionId: string, element: string): RequestDef
  ELEMENT_GETTAGNAME(sessionId: string, element: string): RequestDef
  ELEMENT_GETRECT(sessionId: string, element: string): RequestDef
  ELEMENT_SCREENSHOT(sessionId: string, element: string): RequestDef
  ELEMENT_CLICK(sessionId: string, element: string): RequestDef
  ELEMENT_CLEAR(sessionId: string, element: string): RequestDef
  ELEMENT_ISENABLED(sessionId: string, element: string): RequestDef
  ELEMENT_ISSELECTED(sessionId: string, element: string): RequestDef
  ELEMENT_SENDKEYS(sessionId: string, element: string, keys: string): RequestDef
  EXECUTE_SYNC(sessionId: string, script: string, ...args: any[]): RequestDef
  EXECUTE_ASYNC(sessionId: string, script: string, ...args: any[]): RequestDef
  COOKIE_GETALL(sessionId: string): RequestDef
  COOKIE_GET(sessionId: string, name: string): RequestDef
  COOKIE_CREATE(sessionId: string, cookie: CookieDef): RequestDef
  COOKIE_DELETE(sessionId: string, name: string): RequestDef
  COOKIE_DELETEALL(sessionId: string): RequestDef
  ALERT_ACCEPT(sessionId: string): RequestDef
  ALERT_DISMISS(sessionId: string): RequestDef
  ALERT_GETTEXT(sessionId: string): RequestDef
  ALERT_SENDTEXT(sessionId: string, text: string): RequestDef
}
