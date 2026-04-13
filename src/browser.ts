import { Element } from './index.js'
import { WebDriverError } from './error.js'
import { ActionSequence } from './interface/actions.js'
import { PrintOptions } from './interface/print.js'
import { TimeoutsDef } from './interface/timeouts.js'
import { Using, WebDriver } from './swd.js'
import { Window, WindowType } from './window.js'

export enum BrowserType {
  Chrome = 'chrome',
  Chromium = 'chromium',
  Edge = 'msedge',
  Firefox = 'firefox',
  Safari = 'safari'
}

/**
 * An object which represent a webdriver session.
 */
export class Browser {
  public readonly session: string = null
  public readonly browserType: BrowserType
  public readonly timeouts: TimeoutsDef

  private _webdriver: WebDriver = null
  private _closed: boolean = false

  public get closed() {
    return this._closed
  }

  /**
   * Browser constructor, should be invoked only by a Webdriver instance
   * @internal
   */
  public constructor(
    session: string,
    type: BrowserType,
    timeouts: TimeoutsDef,
    webdriver: WebDriver
  ) {
    this.session = session
    this.browserType = type
    this._webdriver = webdriver
    this.timeouts = timeouts
  }

  /**
   * Close the current browser and all the related windows
   */
  public async close() {
    await this._webdriver.browser(this).stop()
    this._closed = true
    return
  }

  /**
   * Retreive the current broswer's windows which has the focus
   * @return a window which has the focus
   */
  public async getCurrentWindow() {
    return this._webdriver.browser(this).getCurrentWindow()
  }

  /**
   * Retreive all the windows related to the browser
   * @return all the windows objects related to the open browser
   */
  public async getAllWindows() {
    return this._webdriver.browser(this).getAllWindows()
  }

  /**
   *
   * @returns the title of the current context
   */
  public async getTitle() {
    return this._webdriver.browser(this).getTitle()
  }

  /**
   * Open a new Window or Tab which will launch "about:blank" url
   * @param type Allow to chose if the new Window is a "Tab" type or "Window" type
   * @returns the newly created Window object
   */
  public async newWindow(type: WindowType): Promise<Window> {
    return this._webdriver.browser(this).newWindow(type)
  }

  /**
   *
   * @param using
   * @param value
   * @param timeout
   * @returns
   */
  public async findElement(
    using: Using,
    value: string,
    timeout: number = null,
    fromElement: Element = null
  ): Promise<Element> {
    if (this._closed) throw new WebDriverError('Browser session is closed.')
    if (fromElement)
      return <Promise<Element>>fromElement.findElement(using, value, timeout)
    return <Promise<Element>>(
      this._webdriver.browser(this).findElement(using, value, timeout)
    )
  }

  /**
   *
   * @param using
   * @param value
   * @param timeout
   * @returns
   */
  public async findElements(
    using: Using,
    value: string,
    timeout: number = null,
    fromElement: Element = null
  ): Promise<Element[]> {
    if (fromElement)
      return <Promise<Element[]>>fromElement.findElements(using, value, timeout)
    return <Promise<Element[]>>(
      this._webdriver.browser(this).findElement(using, value, timeout, true)
    )
  }

  /**
   *
   * @param script
   * @param args
   * @returns
   */
  public async executeSync(script: string | Function, ...args: any[]) {
    return this._webdriver.browser(this).executeSync(script, args)
  }

  /**
   *
   * @param script
   * @param args
   * @returns
   */
  public async executeAsync(script: string | Function, ...args: any[]) {
    return this._webdriver.browser(this).executeAsync(script, args)
  }

  /**
   *
   * @returns
   */
  public navigate() {
    return this._webdriver.browser(this).navigate()
  }

  public screenshot() {
    return this._webdriver.browser(this).screenshot()
  }

  public frame() {
    return this._webdriver.browser(this).frame()
  }

  /**
   *
   */
  public cookie() {
    return this._webdriver.browser(this).cookie()
  }

  /**
   * Get current session timeouts
   */
  public async getTimeouts() {
    return this._webdriver.browser(this).getTimeouts()
  }

  /**
   * Set session timeouts
   */
  public async setTimeouts(timeouts: { implicit?: number; pageLoad?: number; script?: number }) {
    return this._webdriver.browser(this).setTimeouts(timeouts)
  }

  /**
   * Get the page source of the current document
   */
  public async getPageSource() {
    return this._webdriver.browser(this).getPageSource()
  }

  /**
   * Print the current page to PDF
   * @returns a base64-encoded PDF string
   */
  public async printPage(options?: PrintOptions) {
    return this._webdriver.browser(this).printPage(options)
  }

  /**
   * Perform a sequence of input actions
   */
  public async performActions(actions: ActionSequence[]) {
    return this._webdriver.browser(this).performActions(actions)
  }

  /**
   * Release all keys and pointer buttons currently held
   */
  public async releaseActions() {
    return this._webdriver.browser(this).releaseActions()
  }
}
