import { Element, Window, Capabilities, Browser } from './swd.js'
import {
  SessionDef,
  TimeoutsDef,
  CookieDef,
  ActionSequence,
  PrintOptions
} from './interface.js'
import { LocationError, WebDriverResponseError, WebDriverError } from './error.js'
import { Logger } from './utils/logger.js'
import { BrowserType } from './browser.js'
import { WindowType } from './window.js'
import { ProtocolDriver, ElementRef } from './driver/protocol-driver.js'
import { W3CDriver } from './driver/w3c-driver.js'
import { CDPDriver } from './driver/cdp-driver.js'
import { CDPOptions } from './cdp/options.js'

export enum Using {
  id = 'id',
  name = 'name',
  className = 'className',
  link = 'link text',
  partialLink = 'partial link text',
  css = 'css selector',
  tag = 'tag name',
  xpath = 'xpath'
}

export enum Protocol {
  W3C = 'W3C',
  JSONWire = 'JSONWire'
}

export class WebDriver {
  private static _onGoingSessions: {
    [sessionId: string]: { driver: ProtocolDriver }
  } = {}

  public static defaultHeadless = false

  private _driver: ProtocolDriver
  private _serverURL: URL

  public get serverURL() {
    return this._serverURL
  }

  /** @internal */
  public get driver(): ProtocolDriver {
    return this._driver
  }

  private async _resolveFindResult(
    session: string,
    using: Using,
    value: string,
    multiple: boolean,
    fromElement: Element | null
  ): Promise<ElementRef | ElementRef[] | null> {
    const elementOrDocument = fromElement ? 'arguments[0]' : 'document'
    const argNumber = fromElement ? 1 : 0
    const scriptArgs = fromElement ? [fromElement, value] : [value]

    switch (using) {
      case Using.id: {
        const script = multiple
          ? `return [ document.getElementById(arguments[0]) ];`
          : `return document.getElementById(arguments[0]);`
        if (fromElement)
          Logger.warn(
            'Can\'t retreive inside an element for "id" locator, using document scope instead'
          )
        const raw = await this._driver.executeSync(session, script, [value])
        return extractElementsFromScript(raw, multiple)
      }
      case Using.name: {
        const script =
          `return document.getElementsByName(arguments[0])` + (multiple ? '' : '[0]')
        if (fromElement)
          Logger.warn(
            'Can\'t retreive inside an element for "name" locator, using document scope instead'
          )
        const raw = await this._driver.executeSync(session, script, [value])
        return extractElementsFromScript(raw, multiple)
      }
      case Using.className: {
        const script =
          `return ${elementOrDocument}.getElementsByClassName(arguments[${argNumber}])` +
          (multiple ? '' : '[0]')
        const raw = await this._driver.executeSync(session, script, scriptArgs)
        return extractElementsFromScript(raw, multiple)
      }
      default: {
        if (fromElement) {
          const elementId = fromElement.toString()
          return multiple
            ? await this._driver.elementFindElements(session, elementId, using, value)
            : await this._driver.elementFindElement(session, elementId, using, value)
        }
        return multiple
          ? await this._driver.findElements(session, using, value)
          : await this._driver.findElement(session, using, value)
      }
    }
  }

  /**
   * Create a SimpleWebDriver object which allows to interact with a webdriver server.
   * @deprecated Use {@link WebDriver.w3c} or {@link WebDriver.cdp} instead.
   * Will be removed in a future major version.
   * @param serverURL The URL of the webdriver server
   * @param protocol The type of protocol (see Protocol enum)
   */
  public constructor(serverURL: string, protocol: Protocol = Protocol.W3C) {
    this._serverURL = new URL(serverURL)
    if (this.serverURL.protocol !== 'http:' && this.serverURL.protocol !== 'https:') {
      throw new TypeError('Invalid Protocol: Webdriver only supports http or https')
    }
    if (protocol !== Protocol.W3C) {
      throw new Error(
        `Protocol ${protocol} is not implemented. Only W3C is currently supported.`
      )
    }
    this._driver = new W3CDriver(this._serverURL)
  }

  /**
   * Create a WebDriver that talks to a W3C WebDriver HTTP server
   * (chromedriver, geckodriver, msedgedriver, safaridriver...).
   *
   * @param serverURL Absolute http(s) URL of the WebDriver server.
   */
  public static w3c(serverURL: string): WebDriver {
    return new WebDriver(serverURL, Protocol.W3C)
  }

  /**
   * Create a WebDriver that speaks Chrome DevTools Protocol directly with
   * a Chromium-based browser. The library launches and manages the browser
   * process itself (no external driver binary required).
   *
   * Only `startSession` / `stopSession` / `getStatus` are wired up today;
   * other operations throw until they land incrementally.
   *
   * @param options Browser launch configuration.
   */
  public static cdp(options: CDPOptions = {}): WebDriver {
    const wd = Object.create(WebDriver.prototype) as WebDriver
    ;(wd as any)._driver = new CDPDriver(options)
    ;(wd as any)._serverURL = new URL('cdp://localhost')
    return wd
  }

  public async status() {
    return this._driver.getStatus()
  }

  /** @internal  */
  public browser(browser: Browser) {
    if (browser.closed) throw new WebDriverError('Browser session is closed.')
    const session = browser.session
    const driver = this._driver
    return {
      getTitle: () => driver.getTitle(session),
      getCurrentWindow: async () => {
        const handle = await driver.windowGetHandle(session)
        return new Window(handle, browser, this)
      },
      getAllWindows: async () => {
        const handles = await driver.windowGetHandles(session)
        return handles.map(h => new Window(h, browser, this))
      },
      newWindow: async (type: WindowType) => {
        const res = await driver.windowCreate(session, type)
        return new Window(res.handle, browser, this)
      },
      stop: async () => {
        await driver.stopSession(session)
        delete WebDriver._onGoingSessions[session]
      },
      findElement: async (
        using: Using,
        value: string,
        timeout: number = null,
        multiple: boolean = false,
        fromElement: Element = null
      ) => {
        let timer = true
        if (!timeout) timeout = browser.timeouts.implicit

        let result: ElementRef | ElementRef[] | null = null
        let lastError: Error | null = null

        setTimeout(() => (timer = false), timeout)
        let retryable = true
        do {
          try {
            result = await this._resolveFindResult(
              session,
              using,
              value,
              multiple,
              fromElement
            )
          } catch (err) {
            lastError = err as Error
            result = null
            Logger.trace(err)
            if (
              !(err instanceof WebDriverResponseError) ||
              !(err as WebDriverResponseError).httpResponse
            ) {
              retryable = false
            }
          }
        } while (
          retryable &&
          (result === null ||
            (Array.isArray(result) && result.length === 0)) &&
          timer
        )

        if (
          result &&
          (!Array.isArray(result) || result.length > 0)
        ) {
          if (Array.isArray(result)) {
            return result.map(id => new Element(id, browser, this))
          }
          return new Element(result, browser, this)
        }

        if (lastError instanceof WebDriverResponseError) {
          const sc = lastError.httpResponse?.statusCode
          if (sc !== undefined && sc < 500) throw new LocationError(using, value, timeout)
          throw lastError
        }
        throw new LocationError(using, value, timeout)
      },
      executeSync: async (script: string | Function, args: any[] = []) => {
        if (typeof script !== 'string')
          script = 'return (' + script + ').apply(null, arguments);'
        return driver.executeSync(session, script, args)
      },
      executeAsync: async (script: string | Function, args: any[] = []) => {
        if (typeof script !== 'string')
          script = '(' + script + ').apply(null, arguments);'
        return driver.executeAsync(session, script, args)
      },
      navigate: () => {
        return {
          refresh: () => driver.navigateRefresh(session),
          to: (url: string) => driver.navigateTo(session, url),
          getCurrentURL: () => driver.getCurrentUrl(session),
          back: () => driver.navigateBack(session),
          forward: () => driver.navigateForward(session)
        }
      },
      screenshot: () => driver.screenshot(session),
      frame: () => {
        return {
          switch: (frameId: string | number | null) =>
            driver.frameSwitch(session, frameId),
          parent: () => driver.frameToParent(session)
        }
      },
      alert: () => {
        return {
          accept: () => driver.alertAccept(session),
          dismiss: () => driver.alertDismiss(session),
          sendText: (text: string) => driver.alertSendText(session, text),
          getText: () => driver.alertGetText(session)
        }
      },
      getTimeouts: () => driver.timeoutsGet(session),
      setTimeouts: (timeouts: {
        implicit?: number
        pageLoad?: number
        script?: number
      }) => driver.timeoutsSet(session, timeouts),
      getPageSource: () => driver.getPageSource(session),
      printPage: (options?: PrintOptions) => driver.pagePrint(session, options),
      performActions: (actions: ActionSequence[]) =>
        driver.actionsPerform(session, actions),
      releaseActions: () => driver.actionsRelease(session),
      cookie: () => {
        return {
          get: (name: string) => driver.cookieGet(session, name),
          getAll: () => driver.cookieGetAll(session),
          create: (cookie: CookieDef) => driver.cookieCreate(session, cookie),
          update: (cookie: CookieDef) => driver.cookieCreate(session, cookie),
          delete: (name: string) => driver.cookieDelete(session, name),
          deleteAll: () => driver.cookieDeleteAll(session)
        }
      }
    }
  }

  /** @internal */
  public window(window: Window = null) {
    const driver = this._driver
    return {
      setSize: (width: number, height: number) =>
        driver.windowSetRect(window.session, width, height),
      getSize: () => driver.windowGetRect(window.session),
      maximize: () => driver.windowMaximize(window.session),
      minimize: () => driver.windowMinimize(window.session),
      fullscreen: () => driver.windowFullscreen(window.session),
      switch: () => driver.windowSwitch(window.session, window.handle),
      close: () => driver.windowClose(window.session)
    }
  }

  /** @internal */
  public element(element: Element = null) {
    const elementId = element.toString()
    const session = element.session
    const driver = this._driver
    return {
      click: () => driver.elementClick(session, elementId),
      clear: () => driver.elementClear(session, elementId),
      sendKeys: (keys: string) => driver.elementSendKeys(session, elementId, keys),
      getValue: () => driver.elementGetProperty(session, elementId, 'value'),
      getText: () => driver.elementGetText(session, elementId),
      getAttribute: (attributeName: string) =>
        driver.elementGetAttribute(session, elementId, attributeName),
      getProperty: (propertyName: string) =>
        driver.elementGetProperty(session, elementId, propertyName),
      getTagName: () => driver.elementGetTagName(session, elementId),
      getCSSValue: (cssPropertyName: string) =>
        driver.elementGetCss(session, elementId, cssPropertyName),
      isSelected: () => driver.elementIsSelected(session, elementId),
      isEnabled: () => driver.elementIsEnabled(session, elementId),
      screenshot: () => driver.elementScreenshot(session, elementId),
      findElement: async (using: Using, value: string, timeout: number = null) => {
        return <Promise<Element>>(
          this.browser(element.browser).findElement(using, value, timeout, false, element)
        )
      },
      findElements: async (using: Using, value: string, timeout: number = null) => {
        return <Promise<Element[]>>(
          this.browser(element.browser).findElement(using, value, timeout, true, element)
        )
      }
    }
  }

  public async start(
    browserType: BrowserType,
    capabilities: Capabilities = new Capabilities(browserType)
  ): Promise<Browser> {
    const session: SessionDef = await this._driver.startSession(browserType, capabilities)
    let error: WebDriverResponseError | undefined

    if (!session) {
      error = new WebDriverResponseError({ body: { value: null } } as any)
      error.message = 'Response is empty or null'
      Logger.error('Response is empty or null')
    } else {
      if (!session.sessionId) {
        error = new WebDriverResponseError({ body: { value: session } } as any)
        error.message = 'Missing property sessionId'
        Logger.error('Missing property sessionId')
      } else if (!session.capabilities) {
        error = new WebDriverResponseError({ body: { value: session } } as any)
        error.message = 'Missing property capabilities'
        Logger.error('Missing property capabilities')
      } else if (!session.capabilities.timeouts) {
        Logger.warn('No timeouts provided by Webdriver server')
        session.capabilities.timeouts = {
          implicit: 0,
          pageLoad: 3000,
          script: 30000
        }
      }
    }
    if (error) {
      throw error
    }
    const sessionId: string = session.sessionId
    const timeouts: TimeoutsDef = session.capabilities.timeouts
    const browser = new Browser(sessionId, browserType, timeouts, this)
    WebDriver._onGoingSessions[sessionId] = { driver: this._driver }
    return browser
  }

  public static async cleanSessions(): Promise<void> {
    for (const sessionId in WebDriver._onGoingSessions) {
      try {
        const inf = WebDriver._onGoingSessions[sessionId]
        await inf.driver.stopSession(sessionId)
        Logger.info('Cleaned session : ' + sessionId)
      } catch {
        Logger.warn("Can't stop ongoing session : " + sessionId)
      }
    }
    WebDriver._onGoingSessions = {}
  }
}

const w3cElementKey = 'element-6066-11e4-a52e-4f735466cecf'

function extractElementsFromScript(
  raw: any,
  multiple: boolean
): ElementRef | ElementRef[] | null {
  if (multiple) {
    if (Array.isArray(raw)) {
      return raw
        .map(v => (v && typeof v === 'object' ? v[w3cElementKey] : null))
        .filter((id): id is string => typeof id === 'string')
    }
    if (raw && typeof raw === 'object') {
      const id = raw[w3cElementKey]
      return typeof id === 'string' ? [id] : []
    }
    return []
  }
  if (!raw || typeof raw !== 'object') return null
  const id = raw[w3cElementKey]
  return typeof id === 'string' ? id : null
}
