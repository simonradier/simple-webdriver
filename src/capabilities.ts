import { BrowserType } from "./swd"

export class Capabilities {

  public constructor(browserType : BrowserType) {
    switch (browserType) {
      case 'chrome':
      case 'chromium':
        this.browserOptions = 'goog:chromeOptions'
        break
      case 'firefox':
        this.browserOptions = 'moz:firefoxOptions'
        break
      case 'msedge':
        this.browserOptions = 'ms:edgeOptions'
        break
      case 'safari':
        this.browserOptions = 'safari:options'
    } 
    this.alwaysMatch = { browserName : browserType }
    this.alwaysMatch[this.browserOptions] = { args : [] }
  }

  private browserOptions = "browserOptions"
  public alwaysMatch : any

  public addArguments(arg: string) {
    this.alwaysMatch[this.browserOptions].args.push(arg)
  }
}
