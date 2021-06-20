import { Element } from ".";
import { WebDriverError } from "./error";
import { TimeoutsDef } from "./interface/timeouts";
import { Capabilities, Using, WebDriver, Window } from "./swd";
import { WindowType } from "./window";

export enum BrowserType {
    Chrome = "chrome",
    Chromium = "chromium",
    Edge = "msedge",
    Firefox = "firefox",
    Safari = "safari",
}

/**
 * An object which represent a webdriver session.
 */
export class Browser {

    public readonly session : string = null;
    public readonly browserType : BrowserType;
    public readonly timeouts : TimeoutsDef;


    private _webdriver : WebDriver = null;
    private _closed : boolean = false;
    
    public get closed () {
        return this._closed;
    }

    /**
     * Browser constructor, should be invoked only by a Webdriver instance
     * @internal
     */
    public constructor (session : string, type : BrowserType, timeouts : TimeoutsDef, webdriver : WebDriver) {
        this.session = session;
        this.browserType = type;
        this._webdriver = webdriver;
        this.timeouts = timeouts;
    }

    /**
     * Close the current browser and all the related windows 
     */
    public async close() {
        if (this.closed)
            throw (new WebDriverError("Browser session is closed."));
        this._closed = true;
        return this._webdriver.browser(this).stop();
    }

    /**
     * Retreive the current broswer's windows which has the focus
     * @return a window which has the focus
     */
    public async getCurrentWindow () {
        if (this._closed)
            throw (new WebDriverError("Can't getTitle of a closed browser"));
        return this._webdriver.browser(this).getCurrentWindow();
    }

    /**
     * Retreive all the windows related to the browser
     * @return all the windows objects related to the open browser
     */
    public async getAllWindows () {
        if (this._closed)
            throw (new WebDriverError("Can't getTitle of a closed browser"));
        return this._webdriver.browser(this).getAllWindows();
    }

    /**
     * 
     * @returns the title of the current context
     */
    public async getTitle() {
        if (this._closed)
            throw (new WebDriverError("Can't getTitle of a closed browser"));
        return this._webdriver.browser(this).getTitle();
    }

    /**
     * Open a new Window or Tab which will launch "about:blank" url
     * @param type Allow to chose if the new Window is a "Tab" type of "Window" type
     * @returns 
     */
    public async newWindow(type : WindowType) {
        if (this._closed)
            throw (new WebDriverError("Browser session is closed."));
        return this._webdriver.browser(this).newWindow(type);
    }

    /**
     * 
     * @param using 
     * @param value 
     * @param timeout 
     * @returns 
     */
    public async findElement(using : Using, value : string, timeout : number = null) : Promise<Element> {
        if (this._closed)
            throw (new WebDriverError("Browser session is closed."));
        return <Promise<Element>>  this._webdriver.browser(this).findElement(using, value, timeout);
    }

    /**
    * 
    * @param using 
    * @param value 
    * @param timeout 
    * @returns 
    */
   public async findElements(using : Using, value : string, timeout : number = null) : Promise<Element[]> {
       if (this._closed)
           throw (new WebDriverError("Browser session is closed."));
       return <Promise<Element[]>> this._webdriver.browser(this).findElement(using, value, timeout, true);
   }

    /**
     * 
     * @param script 
     * @param args 
     * @returns 
     */
    public async executeSync(script : string | Function, ...args: any[]) {
        if (this._closed)
            throw (new WebDriverError("Browser session is closed."));
        return this._webdriver.browser(this).executeSync(script, args);
    }


    /**
     * 
     * @param script 
     * @param args 
     * @returns 
     */
    public async executeAsync(script : string | Function, ...args: any[]) {
        if (this._closed)
            throw (new WebDriverError("Browser session is closed."));
        return this._webdriver.browser(this).executeAsync(script, args);
    }

    /**
     * 
     * @returns 
     */
    public navigate () {
        if (this._closed)
            throw (new WebDriverError("Browser session is closed."));   
        return this._webdriver.browser(this).navigate();
    }

    /**
     * 
     */
    public cookie () {
        if (this._closed)
            throw (new WebDriverError("Browser session is closed.")); 
        return this._webdriver.browser(this).cookie();        
    }
}