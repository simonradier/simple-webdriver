import { WebDriverError } from './error'
import { WindowRect } from './interface'
import { WebDriver } from './swd'
import { Browser } from './swd'

export enum WindowType {
  Tab = 'tab',
  Window = 'window'
}

/**
 * Represent a SWD Window
 */
export class Window {
  public readonly rect: WindowRect
  public readonly handle: string
  public readonly browser: Browser = null
  private readonly _webdriver: WebDriver = null
  private _closed: boolean = false

  public get session() {
    return this.browser.session
  }

  constructor(handle: string, browser: Browser, webdriver: WebDriver) {
    this.handle = handle
    this.browser = browser
    this._webdriver = webdriver
  }

  public async setSize(width: number, height: number) {
    if (this._closed) throw new WebDriverError("Can't setSize of a closed window")

    await this.switch()
    return this._webdriver.window(this).setSize(width, height)
  }

  public async getSize() {
    if (this._closed) throw new WebDriverError("Can't getSize of a closed window")

    await this.switch()
    return this._webdriver.window(this).getSize()
  }

  public async maximize() {
    if (this._closed) throw new WebDriverError("Can't maximize of a closed window")

    await this.switch()
    return this._webdriver.window(this).maximize()
  }

  public async minimize() {
    if (this._closed) throw new WebDriverError("Can't minimize of a closed window")

    await this.switch()
    return this._webdriver.window(this).minimize()
  }

  public async fullscreen() {
    if (this._closed) throw new WebDriverError("Can't fullscreen of a closed window")

    await this.switch()
    return this._webdriver.window(this).fullscreen()
  }

  public async switch(): Promise<void> {
    if (this._closed) throw new WebDriverError("Can't switch to a closed window")

    await this._webdriver.window(this).switch()
  }

  public async close() {
    if (this._closed) throw new WebDriverError('Window is already closed')
    await this.switch()

    this._closed = true
    return this._webdriver.window(this).close()
  }

  public toString() {
    return this.handle
  }
}
