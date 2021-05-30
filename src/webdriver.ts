import { Element, Window, Capabilities, Browser } from "./swd";
import { HttpResponse } from "./utils/http-client";
import { WindowRect, ElementDef, SessionDef, TimeoutsDef, WDAPIDef, ResponseDef, CookieDef, RequestDef} from "./interface"
import * as wdapi from "./api";
import { LocationError, WebDriverResponseError, WebDriverError } from "./error";
import { Logger } from "./utils/logger";
import { BrowserType } from "./browser";
import { WindowType } from "./window";


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

    /**
     * Create a SimpleWebDriver object which allows to interact with a webdriver server
     * @param serverURL The URL of the webdriver server
     * @param protocol The type of protocol (see Protocol enum)
     */

    public constructor(serverURL : string, protocol : Protocol = Protocol.W3C) {
        this._serverURL = new URL(serverURL);
        if (this.serverURL.protocol !== 'http:' && this.serverURL.protocol !== 'https:') {
            let err = new TypeError("Invalid Protocol: Webdriver only supports http or https");
            throw (err);
        }
    
        this._api = new wdapi[protocol]();
    }


    /** @internal  */
    public browser(browser : Browser) {
        let session = browser.session;
        return {
            /**
             * 
             */
            getTitle : () => {
                return new Promise<string> (async (resolve, reject) => {
                    wdapi.call<string>(this.serverURL, this._api.WINDOW_GETTITLE(session)).then( resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });                  
            },
            /**
             * 
             */
            getCurrentURL : () => {
                return new Promise<string> (async (resolve, reject) => {
                    wdapi.call<string>(this.serverURL, this._api.NAVIGATE_CURRENTURL(session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            /**
             * Retreive a Window object which represent the current top level Window
             * @returns a Window object of the current top level Window
             */
            getCurrentWindow : async () => {
                try {
                    let resp = await wdapi.call<string>(this.serverURL, this._api.WINDOW_GETHANDLE(session));
                    let result : Window = new Window(resp.body.value, browser, this);
                    return result;
                } catch (err) {
                    throw (err);
                }
            },
            /**
             * Retreive a list Window objects which represent all the opened windows
             * @returns a list of Window objects related to the browser session
             */
            getAllWindows : async () => {
                try {
                    let resp = await wdapi.call<string[]>(this.serverURL, this._api.WINDOW_GETHANDLES(session));
                    let result : Array<Window> = new Array<Window>();
                    for (let handle in resp.body.value) {
                        result.push(new Window(handle, browser, this))
                    }
                    return result;
                } catch (err) {
                    throw (err);
                }
            },
            /**
             * Retreive a list Window objects which represent all the opened windows
             * @returns a list of Window objects related to the browser session
             */
             newWindow : async (type : WindowType) => {
                try {
                    let resp = await wdapi.call<string[]>(this.serverURL, this._api.WINDOW_CREATE(session, type));
                    let result : Array<Window> = new Array<Window>();
                    for (let handle in resp.body.value) {
                        result.push(new Window(handle, browser, this))
                    }
                    return result;
                } catch (err) {
                    throw (err);
                }
            },
            /**
             * Stop the browser session and close all related windows
             * @returns void
             */
            stop : async () => {
                if (!browser && !browser.session) {
                    throw (new WebDriverError("start must be called first"))
                } else {
                    try {
                        await wdapi.call<any>(this.serverURL, this._api.SESSION_STOP(session));
                        delete WebDriver._onGoingSessions[browser.session];
                        return;
                    } catch (err ) {
                        throw (err);
                    }
                }
            },
            findElement : async (using : Using, value : string, timeout : number = null) => {
                let timer = true;
                if (!timeout)
                    timeout = browser.timeouts.implicit;
                let resp : HttpResponse<ResponseDef<ElementDef>>;
                let script = "";
                let request : RequestDef;
                let error : WebDriverResponseError;

                // Calculate the best type of request depending of the type of lookup
                switch (using) {
                    case Using.id :
                        script = "return document.getElementById(arguments[0]);"
                    case Using.className :
                    case Using.name  :
                        script = (script !== "") ? script : "return document.getElementsBy" + using.charAt(0).toUpperCase() + using.slice(1) + "(arguments[0])[0];"
                        request = this._api.EXECUTE_SYNC(session, script, [ value ]);
                    break;
                    default:
                        request = this._api.FINDELEMENT(session, using, value);
                    break;
                }

                // Loop until the timeout callback is resolved or if the lookup succeded
                setTimeout(() => timer = false, timeout);
                do {
                    try {
                        resp = await wdapi.call<ElementDef>(this.serverURL, request);
                    } catch (err) {
                        error = err;
                        resp = err.httpResponse;
                        Logger.trace(resp || err);
                    }
                } while (resp && (resp.body.value === null || resp.statusCode !== 200 ) && timer)

                if (resp && resp.statusCode === 200 && resp.body.value) { // If the look up succeded
                    const element = new Element(resp.body.value[Object.keys(resp.body.value)[0]], browser, this)
                    return element;
                } else { // if the lookup failed
                    if (resp && resp.statusCode === 404)
                        throw (new LocationError(using, value, timeout));
                    else
                        throw (error);
                }                
            },
            executeSync : async (script : string | Function, ...args: any[]) => {
                try {
                    if (typeof script !== "string")
                        script = 'return (' + script + ').apply(null, arguments);';
                    let resp = await wdapi.call<any>(this.serverURL, this._api.EXECUTE_SYNC(session, script, args));
                    return resp.body.value; 
                } catch (err) {
                    throw (err);
                }    
            },
            executeAsync : async (script : string | Function, ...args: any[]) => {
                try {
                    if (typeof script !== "string")
                        script = 'return (' + script + ').apply(null, arguments);';
                    let resp = await wdapi.call<any>(this.serverURL, this._api.EXECUTE_ASYNC(session, script, args));
                    return resp.body.value; 
                } catch (err) {
                    throw (err);
                }  
            },
            navigate : () => {
                return {
                    refresh : () => {
                        return new Promise<void> (async (resolve, reject) => {
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_REFRESH(session)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    },
                    to : (url : string) => {
                        return new Promise<void> (async (resolve, reject) => {
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_TO(session, url)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    },
                    back : () => {
                        return new Promise<void> (async (resolve, reject) => {
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_BACK(session)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    },            
                    forward : () => {
                        return new Promise<void> (async (resolve, reject) => {
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_FORWARD(session)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    }
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
            setSize : (width : number, height : number) => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_SETRECT(window.session, width, height)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            getSize : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_GETRECT(window.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            maximize : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_MAXIMIZE(window.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })       
            },
            minimize : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_MINIMIZE(window.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })                    
            },
            fullscreen : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_FULLSCREEN(window.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })                  
            },
            switch : () => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<void>(this.serverURL, this._api.WINDOW_SWITCH(window.session, window.handle)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })       
            },
            screenshot : () => {
                return new Promise<string> (async (resolve, reject) => {
                    wdapi.call<string>(this.serverURL, this._api.WINDOW_SCREENSHOT(window.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })  
            },
            close : () => {
                return new Promise<string> (async (resolve, reject) => {
                    wdapi.call<string>(this.serverURL, this._api.WINDOW_CLOSE(window.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })                  
            }    
        }
    }

    /**
     * @internal
     * @param element 
     * @returns 
     */
    public element(element : Element = null) {
        let elementId = element.toString();
        let session = element.session;
        return {
            click : () => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_CLICK(session, elementId)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            clear : () => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_CLEAR(session, elementId)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            sendKeys : (keys : string) => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_SENDKEYS(session, elementId, keys)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            getValue : () => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETPROPERTY(session, elementId, "value")).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getText : () => {
                return new Promise<string> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETTEXT(session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            getAttribute : (attributeName : string) => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETATTRIBUTE(session, elementId, attributeName)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getProperty : (propertyName : string) => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETPROPERTY(session, elementId, propertyName)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getTagName : () => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETTAGNAME(session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getCSSValue : (cssPropertyName : string) => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETCSS(session, elementId, cssPropertyName)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            isSelected : () => {
                return new Promise<boolean> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_ISSELECTED(session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            isEnabled : () => {
                return new Promise<boolean> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_ISENABLED(session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            }
        }
    }

    /*public cookies =  {
        getAll : () => {
            return new Promise<CookieDef[]> ((resolve, reject) => {
                wdapi.call<CookieDef[]>(this.serverURL, this._api.COOKIE_GETALL(this.session)).then(resp => {
                    resolve(resp.body.value);
                }).catch(err => {
                    reject(err);
                });
            });
        },
        get : (name : string) => {
            return new Promise<CookieDef> ((resolve, reject) => {
                wdapi.call<CookieDef>(this.serverURL, this._api.COOKIE_GET(this.session, name)).then(resp => {
                    resolve(resp.body.value);
                }).catch(err => {
                    reject(err);
                });
            });
        },
        add : (cookie : CookieDef) => {
            return new Promise<void> ((resolve, reject) => {
                wdapi.call<void>(this.serverURL, this._api.COOKIE_ADD(this.session, cookie)).then(resp => {
                    resolve(resp.body.value);
                }).catch(err => {
                    reject(err);
                });
            });
        },
        update : (cookie : CookieDef) => {
            return new Promise<void> ((resolve, reject) => {
                wdapi.call<void>(this.serverURL, this._api.COOKIE_DELETE(this.session, cookie.name)).then(resp => {
                    wdapi.call<void>(this.serverURL, this._api.COOKIE_ADD(this.session, cookie)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    })
                }).catch(err => {
                        reject(err);
                });
            });
        },
        delete : (name : string) => {
            return new Promise<void> ((resolve, reject) => {
                wdapi.call<void>(this.serverURL, this._api.COOKIE_DELETE(this.session, name)).then(resp => {
                    resolve(resp.body.value);
                }).catch(err => {
                    reject(err);
                });
            });
        },
        deleteAll : () => {
            return new Promise<void> ((resolve, reject) => {
                wdapi.call<void>(this.serverURL, this._api.COOKIE_DELETEALL(this.session)).then(resp => {
                    resolve(resp.body.value);
                }).catch(err => {
                    reject(err);
                });
            });
        }
    }*/

    public wait (...args : any []) {
        throw new Error("Unsupported");
    }

    public async start(browserType : BrowserType, capabilities : Capabilities = Capabilities.default) : Promise<Browser> {
        return new Promise<Browser> (async (resolve, reject) => {
            try {
                const resp = await wdapi.call<SessionDef>(this.serverURL, this._api.SESSION_START(browserType, capabilities.headless));
                let error : WebDriverResponseError;
                let session : string;
                let timeouts : TimeoutsDef;
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
                    reject(error);
                }
                session = resp.body.value.sessionId;
                timeouts = resp.body.value.capabilities.timeouts;
                let browser = new Browser(session, browserType, timeouts, this);
                WebDriver._onGoingSessions[session] = {url : this.serverURL , api : this._api};
                resolve(browser);
            } catch (err) {
                reject(err);
            }
        });
    }

    public static async cleanSessions() : Promise<void> {
        for (let sessionId in WebDriver._onGoingSessions){
            try {
                let inf = WebDriver._onGoingSessions[sessionId]
                await wdapi.call<any>(inf.url, inf.api.SESSION_STOP(sessionId));
                Logger.info("Cleaned session : " + sessionId);
            } catch (e) {
                Logger.warn("Can't stop ongoing session : " + sessionId);
            }
        }
        WebDriver._onGoingSessions = {};
    }
}