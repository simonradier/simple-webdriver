import { Element, Window, Capabilities, Browser } from "./swd";
import { HttpResponse } from "./utils/http-client";
import { WindowRect, ElementDef, SessionDef, TimeoutsDef, WDAPIDef, ResponseDef, CookieDef, RequestDef, ErrorDef} from "./interface"
import * as wdapi from "./api";
import { LocationError, WebDriverResponseError, WebDriverError } from "./error";
import { Logger } from "./utils/logger";
import { BrowserType } from "./browser";
import { WindowType } from "./window";
import { Cookie } from "./cookie";


export enum Using {
    id = "id",
    name = "name",
    className = "className",
    link = "link text",
    partialLink = "partial link text",
    css = "css selector",
    tag = "tag name",
    xpath = "xpath"
}

export enum Protocol {
    W3C = "W3C",
    JSONWire = "JSONWire"
}

export class WebDriver {

    private static _onGoingSessions : { [sessionId : string] : { url : URL, api : WDAPIDef} } = {};

    private static _supportedBrowser : string[] = [
        'chrome',
        'chromium',
        'msedge',
        "firefox",
        "safari",
    ];

    public static defaultHeadless = false;

    private _api : WDAPIDef;

    private _w3c : boolean;

    private _serverURL : URL;
    public get serverURL() {
        return this._serverURL;
    }

    private findElementRequest(session : string, using : Using, value : string, multiple : boolean, element? : Element) {
        // findElement vs FindElement in element
        const elementOrDocument = (element) ? "arguments[0]" : "document" ;
        const argNumber =  (element) ? 1 : 0;
        const elementId = (element) ? element.toString() : null;
    
        let script : string = "";
        let request : RequestDef
 
        switch (using) {
            case Using.id :
                script = (multiple) ? `return [ document.getElementById(arguments[0]) ];` : `return document.getElementById(arguments[0]);`;
                if (element)
                    Logger.warn('Can\'t retreive inside an element for "id" locator, using document scope instead');
                request = this._api.EXECUTE_SYNC(session, script, [ value ]);
                break;
            case Using.name  :
                script = `return document.getElementsByName(arguments[0])` + ((multiple) ? "" : "[0]")
                if (element)
                    Logger.warn('Can\'t retreive inside an element for "name" locator, using document scope instead');
                request = this._api.EXECUTE_SYNC(session, script, [ value ]);
                break
            case Using.className :
                script = `return ${elementOrDocument}.getElementsByClassName(arguments[${argNumber}])` + ((multiple) ? "" : "[0]")
                if (element)
                    request = this._api.EXECUTE_SYNC(session, script, [ element , value ]);
                else
                    request = this._api.EXECUTE_SYNC(session, script, [ value ]);
            break;
            default:
                if (element)
                    request = (multiple) ? this._api.ELEMENT_FINDELEMENTS(session, elementId, using, value) : this._api.ELEMENT_FINDELEMENT(session, elementId, using, value);
                else
                    request = (multiple) ? this._api.FINDELEMENTS(session, using, value) : this._api.FINDELEMENT(session, using, value);               
            break;
        }
        return request;
    }

    /**
     * Create a SimpleWebDriver object which allows to interact with a webdriver server
     * @param serverURL The URL of the webdriver server
     * @param protocol The type of protocol (see Protocol enum)
     */

    public constructor(serverURL : string, protocol : Protocol = Protocol.W3C) {
        this._serverURL = new URL(serverURL);
        if (this.serverURL.protocol !== 'http:' && this.serverURL.protocol !== 'https:') {
            const err = new TypeError("Invalid Protocol: Webdriver only supports http or https");
            throw (err);
        }
        this._api = new wdapi[protocol]();
    }


    /** @internal  */
    public browser(browser : Browser) {
        if (browser.closed)
            throw (new WebDriverError("Browser session is closed."));
        const session = browser.session;
        return {
            /**
             * 
             */
            getTitle : async () => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.GETTITLE(session));
                return resp.body.value;
            },
            /**
             * Retreive a Window object which represent the current top level Window
             * @returns a Window object of the current top level Window
             */
            getCurrentWindow : async () => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.WINDOW_GETHANDLE(session));
                const result : Window = new Window(resp.body.value, browser, this);
                return result;
            },
            /**
             * Retreive a list Window objects which represent all the opened windows
             * @returns a list of Window objects related to the browser session
             */
            getAllWindows : async () => {
                const resp = await wdapi.call<string[]>(this.serverURL, this._api.WINDOW_GETHANDLES(session));
                const result : Array<Window> = new Array<Window>();
                for (const handle in resp.body.value) {
                    result.push(new Window(handle, browser, this))
                }
                return result;
            },
            /**
             * Retreive a list Window objects which represent all the opened windows
             * @returns a list of Window objects related to the browser session
             */
             newWindow : async (type : WindowType) => {
                const resp = await wdapi.call<string[]>(this.serverURL, this._api.WINDOW_CREATE(session, type));
                const result : Array<Window> = new Array<Window>();
                for (const handle in resp.body.value) {
                    result.push(new Window(handle, browser, this))
                }
                return result;
            },
            /**
             * Stop the browser session and close all related windows
             * @returns void
             */
            stop : async () => {
                if (!browser && !browser.session) {
                    throw (new WebDriverError("start must be called first"))
                } else {
                    await wdapi.call<any>(this.serverURL, this._api.SESSION_STOP(session));
                    delete WebDriver._onGoingSessions[browser.session];
                }
            },
            findElement : async (using : Using, value : string, timeout : number = null, multiple : boolean = false, fromElement : Element = null) => {
                let timer = true;
                if (!timeout)
                    timeout = browser.timeouts.implicit;
                let resp : HttpResponse<ResponseDef<ElementDef | ElementDef[] | ErrorDef>>;
                const request : RequestDef = this.findElementRequest(session, using, value, multiple, fromElement)
                let error : WebDriverResponseError;

                // Calculate the best type of request depending of the type of lookup 

                // Loop until the timeout callback is resolved or if the lookup succeded
                setTimeout(() => timer = false, timeout);
                do {
                    try {
                        resp = await wdapi.call<ElementDef | ElementDef[]>(this.serverURL, request);
                    } catch (err) {
                        error = <WebDriverResponseError> err;
                        resp = error.httpResponse;
                        Logger.trace(resp || err);
                    }
                    // findElements in element will return an empty array with a 200 Ok code, if nothing is found
                } while (resp && (resp.body.value === null || (Array.isArray(resp.body.value) && resp.body.value.length === 0) || resp.statusCode !== 200 ) && timer)


                if (resp && resp.statusCode === 200 && ((Array.isArray(resp.body.value) && resp.body.value.length !== 0) || (!Array.isArray(resp.body.value) && resp.body.value))) { // If the look up succeded
                    let result : Element | Element[];
                    if (Array.isArray(resp.body.value))
                        result = resp.body.value.map((elem) => { return new Element(elem["element-6066-11e4-a52e-4f735466cecf"], browser, this)});
                    else
                        result = new Element(resp.body.value["element-6066-11e4-a52e-4f735466cecf"], browser, this)
                    return result;
                } else { // if the lookup failed
                    if (resp && resp.statusCode < 500)
                        throw (new LocationError(using, value, timeout));
                    else
                        throw (error);
                }                
            },
            executeSync : async (script : string | Function, ...args: any[]) => {
                if (typeof script !== "string")
                    script = 'return (' + script + ').apply(null, arguments);';
                const resp = await wdapi.call<any>(this.serverURL, this._api.EXECUTE_SYNC(session, script, ...args));
                return resp.body.value; 
            },
            
            executeAsync : async (script : string | Function, ...args: any[]) => {
                if (typeof script !== "string")
                    script = '(' + script + ').apply(null, arguments);';
                const resp = await wdapi.call<any>(this.serverURL, this._api.EXECUTE_ASYNC(session, script, ...args));
                return resp.body.value; 
            },

            navigate : () => {
                return {
                    refresh : () => {
                        return wdapi.call<void>(this.serverURL, this._api.NAVIGATE_REFRESH(session));
                    },
                    to : (url : string) => {
                        return wdapi.call<void>(this.serverURL, this._api.NAVIGATE_TO(session, url));
                    },
                    /**
                     * 
                     */
                    getCurrentURL : async () => {
                        const resp = await wdapi.call<string>(this.serverURL, this._api.NAVIGATE_CURRENTURL(session));
                        return resp.body.value;
                    },
                    back : () => {
                        return wdapi.call<void>(this.serverURL, this._api.NAVIGATE_BACK(session));
                    },            
                    forward : () => {
                        return wdapi.call<void>(this.serverURL, this._api.NAVIGATE_FORWARD(session));
                    }
                }
            },
            
            getCookie : async (name)  => {
                const resp = await wdapi.call<CookieDef>(this.serverURL, this._api.COOKIE_GET(session, name));
                return resp.body.value;
            },

            getAllCookies : async () => {
                const resp = await wdapi.call<CookieDef[]>(this.serverURL, this._api.COOKIE_GETALL(session));
                return resp.body.value;           
            },
            deleteAllCookies : () => {
                return wdapi.call<void>(this.serverURL, this._api.COOKIE_DELETEALL(session));
            },
            screenshot : () => {
                return wdapi.call<string>(this.serverURL, this._api.SCREENSHOT(session));
            },
            cookie : () => {
                return {
                    create : async (cookie : Cookie) => {
                        return  wdapi.call<void>(this.serverURL, this._api.COOKIE_ADD(session, cookie));
                    },
                    update : async (cookie : Cookie) => {
                            await  wdapi.call<void>(this.serverURL, this._api.COOKIE_DELETE(session, cookie.name));
                            await wdapi.call<void>(this.serverURL, this._api.COOKIE_ADD(session, cookie));
                    },
                    delete : async (cookie : Cookie) => {
                        return  wdapi.call<void>(this.serverURL, this._api.COOKIE_DELETE(session, cookie.name));
                    },
                }
            }
        }
    }

    /**
     * Allow to access windows capabilities, if no window is provided, it will modify the current top level context
     * @param handle 
     * @internal
     */
    public window(window : Window = null) {
        return {
            setSize : async (width : number, height : number) => {
                const resp = await wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_SETRECT(window.session, width, height));
                return resp.body.value;
            },
            getSize : async () => {
                const resp = await wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_GETRECT(window.session));
                return resp.body.value;
            },
            maximize : async () => {
                const resp = await wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_MAXIMIZE(window.session));
                return resp.body.value;
            },
            minimize : async () => {
                const resp = await wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_MINIMIZE(window.session));
                return resp.body.value;
            },
            fullscreen : async () => {
                const resp = await wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_FULLSCREEN(window.session));
                return resp.body.value;
            },
            switch : async () => {
                return await wdapi.call<void>(this.serverURL, this._api.WINDOW_SWITCH(window.session, window.handle));  
            },
            close : () => {
                return wdapi.call<void>(this.serverURL, this._api.WINDOW_CLOSE(window.session));              
            }    
        }
    }

    /**
     * @internal
     * @param element 
     * @returns 
     */
    public element(element : Element = null) {
        const elementId = element.toString();
        const session = element.session;
        return {
            click : async () => {
                await wdapi.call<void>(this.serverURL, this._api.ELEMENT_CLICK(session, elementId));
            },
            clear : async () => {
                await wdapi.call<void>(this.serverURL, this._api.ELEMENT_CLEAR(session, elementId));
            },
            sendKeys : async (keys : string) => {
                await wdapi.call<any>(this.serverURL, this._api.ELEMENT_SENDKEYS(session, elementId, keys));
            },
            getValue : async () => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_GETPROPERTY(session, elementId, "value"));
                return resp.body.value;
            },
            getText : async () => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_GETTEXT(session, elementId));
                return resp.body.value;
            },
            getAttribute : async (attributeName : string) => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_GETATTRIBUTE(session, elementId, attributeName));
                return resp.body.value; 
            },
            getProperty : async (propertyName : string) => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_GETPROPERTY(session, elementId, propertyName));
                return resp.body.value; 
            },
            getTagName : async () => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_GETTAGNAME(session, elementId));
                return resp.body.value; 
            },
            getCSSValue : async (cssPropertyName : string) => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_GETCSS(session, elementId, cssPropertyName));
                return resp.body.value;
            },
            isSelected : async () => {
                const resp = await wdapi.call<boolean>(this.serverURL, this._api.ELEMENT_ISSELECTED(session, elementId));
                return resp.body.value;
            },
            isEnabled : async () => {
                const resp = await wdapi.call<boolean>(this.serverURL, this._api.ELEMENT_ISENABLED(session, elementId));
                return resp.body.value;
            },
            screenshot : async () => {
                const resp = await wdapi.call<string>(this.serverURL, this._api.ELEMENT_SCREENSHOT(session, elementId));
                return resp.body.value;
            },
            findElement : async (using : Using, value : string, timeout : number = null) => {
                return <Promise<Element>> this.browser(element.browser).findElement(using, value, timeout, false, element);              
            },
            findElements : async (using : Using, value : string, timeout : number = null) => {
                return <Promise<Element[]>> this.browser(element.browser).findElement(using, value, timeout, true, element);              
            },
        }
    }

    public wait (...args : any []) {
        throw new Error("Unsupported");
    }

    public async start(browserType : BrowserType, capabilities : Capabilities = Capabilities.default) : Promise<Browser> {
        const resp = await wdapi.call<SessionDef>(this.serverURL, this._api.SESSION_START(browserType, capabilities.headless));
        let error : WebDriverResponseError;

        if (!resp.body.value) {
            error = new WebDriverResponseError(resp);
            error.message = "Response is empty or null"  
            Logger.error("Response is empty or null")                      
        } else {
            if (!resp.body.value.sessionId) {
                error = new WebDriverResponseError(resp);
                error.message = "Missing property sessionId"
                Logger.error("Missing property sessionId")
            } else if (!resp.body.value.capabilities) {
                error = new WebDriverResponseError(resp);
                error.message = "Missing property capabilities"
                Logger.error("Missing property capabilities")
            } else if (!resp.body.value.capabilities.timeouts) {
                Logger.warn("No timeouts provided by Webdriver server")
                resp.body.value.capabilities.timeouts = {
                    implicit : 0,
                    pageLoad : 3000,
                    script : 30000
                }
            }
        }
        if (error) {
            throw (error);
        }
        const session : string = resp.body.value.sessionId;
        const timeouts : TimeoutsDef = resp.body.value.capabilities.timeouts;
        const browser = new Browser(session, browserType, timeouts, this);
        WebDriver._onGoingSessions[session] = {url : this.serverURL , api : this._api};
        return browser;
    }

    public static async cleanSessions() : Promise<void> {
        for (const sessionId in WebDriver._onGoingSessions){
            try {
                const inf = WebDriver._onGoingSessions[sessionId]
                await wdapi.call<any>(inf.url, inf.api.SESSION_STOP(sessionId));
                Logger.info("Cleaned session : " + sessionId);
            } catch (e) {
                Logger.warn("Can't stop ongoing session : " + sessionId);
            }
        }
        WebDriver._onGoingSessions = {};
    }
}