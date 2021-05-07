import { Capabilities, WebDriver } from "./swd";

export enum BrowserType {
    Chrome = "chrome",
    Chromium = "chromium",
    Edge = "msedge",
    Firefox = "firefox",
    Safari = "safari",
}

export class Browser {

    public readonly session : string = null;
    public readonly browserType : BrowserType;
    private _webdriver : WebDriver = null;

    /**
     * Browser constructor, should be invoked only by Webdriver instance
     */
    public constructor (session : string, type : BrowserType, webdriver : WebDriver) {
        this.session = session;
        this.browserType = type;
        this._webdriver = webdriver
    }

    public async close() {

    }

    public window[]
}