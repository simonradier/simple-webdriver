import { WebDriver, Browser } from "./swd"
import { Using } from "./webdriver";

export class Element {

    public readonly browser : Browser
    public readonly "element-6066-11e4-a52e-4f735466cecf" : string

    private _driver : WebDriver;

    public get session() {
        return this.browser.session;
    }

    public get ELEMENT () {
        return this["element-6066-11e4-a52e-4f735466cecf"];
    }

    public constructor (elementID : string, browser : Browser, driver : WebDriver) {
        this["element-6066-11e4-a52e-4f735466cecf"] = elementID;
        this._driver = driver;
        this.browser = browser;
    }


    public click() : Promise<void> {
        return  this._driver.element(this).click();
    }

    public getAttribute(attributeName : string) : Promise<string> {
        return this._driver.element(this).getAttribute(attributeName);

    }

    public getProperty(propertyName : string) : Promise<string> {
        return this._driver.element(this).getProperty(propertyName);
    }

    public getTagName() : Promise<string> {
        return this._driver.element(this).getTagName();
    }

    public getCSSValue(cssPropertyName : string) : Promise<string> {
        return this._driver.element(this).getCSSValue(cssPropertyName);
    }

    public getValue() : Promise<string> {
        return this._driver.element(this).getValue();

    }

    public getText() : Promise<string> {
        return  this._driver.element(this).getText();
    }

    public clear() : Promise<void> {
        return  this._driver.element(this).clear();
    }

    public sendKeys(keys : string) : Promise<void> {
        return  this._driver.element(this).sendKeys(keys);
    }

    public isSelected() : Promise<boolean> {
        return this._driver.element(this).isSelected();
    }

    public isEnabled() : Promise<boolean> {
        return this._driver.element(this).isEnabled();
    }

    /**
     * Take of screenshot of the selected element
     * @returns a base 64 string of the element screenshot
     */
    public screenshot() : Promise<string> {
        return this._driver.element(this).screenshot();
    }

    /**
     * 
     * @returns 
     */
    public findElement(using : Using, value : string, timeout : number) : Promise<Element> {
        return this._driver.element(this).findElement(using, value, timeout);
    }

    public toString() {
        return this["element-6066-11e4-a52e-4f735466cecf"];
    }
}