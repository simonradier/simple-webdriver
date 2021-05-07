import { Element, Window, Capabilities, Browser } from "./swd";
import { HttpResponse } from "./utils/http-client";
import { WindowRect, ElementDef, SessionDef, TimeoutsDef, WDAPIDef, ResponseDef, CookieDef, RequestDef} from "./interface"
import * as wdapi from "./api";
import { LocationError, WebDriverResponseError, WebDriverError } from "./error";
import { Logger } from "./utils/logger";
import { URL } from "url";
import { BrowserType } from "./browser";


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

    public capabilities = new Capabilities();

    private _timeouts : TimeoutsDef;

    public get timeouts() : TimeoutsDef {
        return this._timeouts;
    }

    private _currentHandle : string = null;

    /**
     * Create a SimpleWebDriver object which allows to interact with a webdriver server
     * @param serverURL The URL of the webdriver server
     * @param browser The type of browser (see Browser enum)
     * @param protocol The type of protocol (see Protocol enum)
     */

    public constructor(serverURL : string, protocol : Protocol = Protocol.W3C) {
        this._serverURL = new URL(serverURL);
        if (this.serverURL.protocol !== 'http:' && this.serverURL.protocol !== 'https:') {
            let err = new TypeError("Invalid Protocol: Webdriver only supports http or https");
            throw (err);
        }

        if (WebDriver.defaultHeadless)
            this.capabilities.headless = true;
        this._api = new wdapi[protocol]();
    }

    /**
     * Retreive a Window object which represent the current top level Window
     * @returns a Window object of the current top level Window
     */
    public async getCurrentWindow (session : string) {
        return new Promise<Window> (async (resolve, reject) => {
            wdapi.call<string>(this.serverURL, this._api.WINDOW_GETHANDLE(this.session)).then( resp => {
                let result : Window = new Window(this, resp.body.value);
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });    
    }

    /**
     * Retreive a list Window objects which represent all the opened windows
     * @returns a Window object of the current top level Window
     */
    public async getAllWindows () {
        return new Promise<Window[]> (async (resolve, reject) => {
            wdapi.call<string[]>(this.serverURL, this._api.WINDOW_GETHANDLES(this.session)).then( resp => {
                let result : Array<Window> = new Array<Window>();
                for (let handle in resp.body.value) {
                    result.push(new Window(this, handle))
                }
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });                     
    }

    /**
     * Allow to access windows capabilities, if no window is provided, it will modify the current top level context
     * @param handle 
     */
    public window(window : Window = null) {
        let handle = (window) ? window.toString() : this._currentHandle;
        return {
            getTitle : () => {
                return new Promise<string> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<string>(this.serverURL, this._api.WINDOW_GETTITLE(this.session)).then( resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });                  
            },
            getCurrentURL : () => {
                return new Promise<string> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<string>(this.serverURL, this._api.NAVIGATE_CURRENTURL(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            setSize : (width : number, height : number) => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_SETRECT(this.session, width, height)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            getSize : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_GETRECT(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            maximize : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_MAXIMIZE(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })       
            },
            minimize : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_MINIMIZE(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })                    
            },
            fullscreen : () => {
                return new Promise<WindowRect> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<WindowRect>(this.serverURL, this._api.WINDOW_FULLSCREEN(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })                  
            },
            switch : () => {
                return new Promise<void> (async (resolve, reject) => {
                    if (handle === this._currentHandle)
                        resolve();
                    wdapi.call<void>(this.serverURL, this._api.WINDOW_SWITCH(this.session, handle)).then(resp => {
                        this._currentHandle = handle;
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })       
            },
            screenshot : () => {
                return new Promise<string> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<string>(this.serverURL, this._api.WINDOW_SCREENSHOT(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })  
            },
            close : () => {
                return new Promise<string> (async (resolve, reject) => {
                    if (handle !== this._currentHandle)
                        await window.switch();
                    wdapi.call<string>(this.serverURL, this._api.WINDOW_CLOSE(this.session)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })                  
            },
            navigate : () => {
                return {
                    refresh : () => {
                        return new Promise<void> (async (resolve, reject) => {
                            if (handle !== this._currentHandle)
                                await window.switch();
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_REFRESH(this.session)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    },
                    to : (url : string) => {
                        return new Promise<void> (async (resolve, reject) => {
                            if (handle !== this._currentHandle)
                                await window.switch();
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_TO(this.session, url)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    },
                    back : () => {
                        return new Promise<void> (async (resolve, reject) => {
                            if (handle !== this._currentHandle)
                                await window.switch();
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_BACK(this.session)).then(resp => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        })
                    },            
                    forward : () => {
                        return new Promise<void> (async (resolve, reject) => {
                            if (handle !== this._currentHandle)
                                await window.switch();
                            wdapi.call<any>(this.serverURL, this._api.NAVIGATE_FORWARD(this.session)).then(resp => {
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

    public element(element : Element = null) {
        let elementId = element.toString();
        return {
            click : () => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_CLICK(this.session, elementId)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            clear : () => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_CLEAR(this.session, elementId)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            sendKeys : (keys : string) => {
                return new Promise<void> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_SENDKEYS(this.session, elementId, keys)).then(resp => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            getValue : () => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETPROPERTY(this.session, elementId, "value")).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getText : () => {
                return new Promise<string> (async (resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETTEXT(this.session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                })
            },
            getAttribute : (attributeName : string) => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETATTRIBUTE(this.session, elementId, attributeName)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getProperty : (propertyName : string) => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETPROPERTY(this.session, elementId, propertyName)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getTagName : () => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETTAGNAME(this.session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            getCSSValue : (cssPropertyName : string) => {
                return new Promise<string> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_GETCSS(this.session, elementId, cssPropertyName)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            isSelected : () => {
                return new Promise<boolean> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_ISSELECTED(this.session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            },
            isEnabled : () => {
                return new Promise<boolean> ((resolve, reject) => {
                    wdapi.call<any>(this.serverURL, this._api.ELEMENT_ISENABLED(this.session, elementId)).then(resp => {
                        resolve(resp.body.value);
                    }).catch(err => {
                        reject(err);
                    });
                });
            }
        }
    }

    public cookies =  {
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
    }

    public async findElement(using : Using, value : string, timeout : number = null) : Promise<Element> {
        return new Promise<Element> (async (resolve, reject) => {
            if (!timeout) {
                timeout = this.timeouts.implicit;
            }
            let timer = true;
            setTimeout(() => timer = false, timeout);
            let resp : HttpResponse<ResponseDef<ElementDef>>;
            let script = "";
            let request : RequestDef;
            let error;
            switch (using) {
                case Using.id :
                    script = "return document.getElementById(arguments[0]);"
                case Using.className :
                case Using.name  :
                    script = (script !== "") ? script : "return document.getElementsBy" + using.charAt(0).toUpperCase() + using.slice(1) + "(arguments[0])[0];"
                    request = this._api.EXECUTE_SYNC(this.session, script, [ value ]);
                break;
                default:
                    request = this._api.FINDELEMENT(this.session, using, value);
                break;
            }
            do {
                try {
                    resp = await wdapi.call<ElementDef>(this.serverURL, request);
                } catch (err) {
                    error = err;
                    resp = err.httpResponse;
                    Logger.trace(resp || err);
                }
            } while (resp && (resp.body.value === null || resp.statusCode !== 200 ) && timer)
            if (resp && resp.statusCode === 200 && resp.body.value) {
                const element = new Element(this, resp.body.value[Object.keys(resp.body.value)[0]])
                resolve(element);
            } else {
                if (resp && resp.statusCode === 404)
                    reject (new LocationError(using, value, timeout));
                else
                    reject (error);
            }
        });
    }


    public async execute(sync : boolean, script : string | Function, ...args: any[]) : Promise<any> {
        return (sync) ? this.executeSync(script, ...args) : this.executeAsync(script, ...args);
    }

    public async executeSync(script : string | Function, ...args: any[]) : Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            if (typeof script !== "string")
                script = 'return (' + script + ').apply(null, arguments);'
            wdapi.call<any>(this.serverURL, this._api.EXECUTE_SYNC(this.session, script, args)).then(resp => {
                resolve(resp.body.value);
            }).catch(err => {
                reject(err);
            });
        });
    }

    public async executeAsync(script : string | Function, ...args : any[]) {
        return new Promise<any> (async (resolve, reject) => {
            if (typeof script !== "string")
                script = 'return (' + script + ').apply(null, arguments);'
            wdapi.call<any>(this.serverURL, this._api.EXECUTE_ASYNC(this.session, script, args)).then(resp => {
                resolve(resp.body.value);
            }).catch(err => {
                reject(err);
            });
        }); 
    }

    public wait (...args : any []) {
        throw new Error("Unsupported");
    }

    public async start(browserType : BrowserType) : Promise<Browser> {
        return new Promise<Browser> (async (resolve, reject) => {
            try {
                const resp = await wdapi.call<SessionDef>(this.serverURL, this._api.SESSION_START(browserType, this.capabilities.headless));
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
                WebDriver._onGoingSessions[session] = {url : this.serverURL , api : this._api};
                try {
                    this._currentHandle = (await this.getCurrentWindow(session)).toString();
                } catch (err) {
                    reject (err);
                }
                resolve(new Browser(session, browserType, this));
            } catch (err) {
                reject(err);
            }
        });
    }

    public async stop() : Promise<void> {
        return new Promise<void> (async (resolve, reject) => {
            if (!this.session) {
                reject(new WebDriverError("start must be called first"))
            } else {
                wdapi.call<any>(this.serverURL, this._api.SESSION_STOP(this.session)).then(resp => {
                    delete WebDriver._onGoingSessions[this._session];
                    this._session = null;
                    this._currentHandle = null;
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }
        });
    }

    public static cleanSessions() : Promise<void> {
        return new Promise<void> (async (resolve, reject) => {
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
            resolve();
        });
    }
}