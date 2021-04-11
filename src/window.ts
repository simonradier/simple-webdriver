import { WebDriverError } from "./error";
import { WindowRect } from "./interface";
import { WebDriver } from "./swd"

/**
 * Represent a SWD Window
 */
export class Window {
    public readonly rect : WindowRect;
    public readonly handle : string;
    private _driver : WebDriver;
    private _closed : boolean = false;

    constructor (driver : WebDriver, handle : string, ) {
        this.handle = handle;
    }

    public async getTitle() {
        if (!this._closed)
            throw (new WebDriverError("Can't getTitle of a closed window"))
        return this._driver.window(this).getTitle();                 
    }

    public async setSize(width : number, height : number) {
        return this._driver.window(this).setSize(width, height);                 
    }

    public async getSize() {
        return this._driver.window(this).getSize();                 
    }

    public async maximize() {
        return this._driver.window(this).maximize();                 
    }

    public async minimize() {
        return this._driver.window(this).minimize();                 
    }

    public async fullscreen() {
        return this._driver.window(this).fullscreen();                 
    }

    public async switch() {
        return this._driver.window(this).switch();                 
    }

    public async screenshot() {
        return this._driver.window(this).screenshot();                 
    }

    public async close() {
        this._closed = false;
        return this._driver.window(this).close();                
    }

    public toString() {
        return this.handle;
    }

    public navigate = () => {
        return {
            refresh : () => {
                return this._driver.window(this).navigate().refresh();
            },
            to : (url : string) => {
                return this._driver.window(this).navigate().to(url);
            },
            back : () => {
                return this._driver.window(this).navigate().back();
            },            
            forward : () => {
                return this._driver.window(this).navigate().forward();
            } 
        }
    }
}
