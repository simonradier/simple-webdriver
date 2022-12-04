/* eslint-disable @typescript-eslint/naming-convention */
export enum WD_TESTED_Browser {
    Chrome = "chrome",
    //Chromium = "chromium",
    Edge = "msedge",
    Firefox = "firefox",
    Safari = "safari"
}

export enum WD_TESTED_Driver {
    Chrome = "chromedriver",
    Chromium = "chromedriver",
    Edge = "msedgedriver",
    Firefox = "geckodriver",
    Safari = "safaridriver"
}

export const WD_SERVER_URL_HTTP = {
    Chrome : "http://localhost:9515",
    Firefox : "http://localhost:4444",
    Chromium : "http://localhost:9515",
    Edge : "http://localhost:9415",
    Safari : "http://localhost:9315",
}

export const WD_SERVER_URL_HTTPS = {
    Chrome : "https://localhost:9515",
    Firefox : "https://localhost:4444",
    Chromium : "https://localhost:9515",
    Edge : "https://localhost:9415",
    Safari : "https://localhost:9315",
}

export const WD_FRAME_INFO = {
    "number1" : 0,
    "number2" : 1,
    "number3" : 2,
    "top-context" : null,
    "id1" : "frame-test1",
    "id2" : "frame-test2",
    "id3" : "frame-unknown"
}

export const WD_WEBSITE_URL_HTTP =  "https://simonradier.github.io/simple-webdriver/test/html/"


export const WD_SESSION_ID = "session-test-id-1337"

export const WD_ELEMENT_ID = "element-test-id-1337"

export const WD_ELEMENT_ID_FAKE = "element-FAKE-id-1337"

export const WD_WINDOW_ID = "window-test-id-1337"

export const WD_WINDOW2_ID = "window-test-id-1667"

export const WD_ATTRIBUTE_NAME = "value"

export const WD_CSS_ATTRIBUTE_NAME = "text-align"

export const WD_PROPERTY_NAME = "value"



export const WD_ELEMENT_SEARCH = {
    id : "id_1234",
    name : "input_1234",
    className : "class_1234",
    link : "This is a link to test1.html",
    partialLink : "test2.html",
    css : "#id_1234",
    tag : "h1",
    xpath : "/html/body/span"
}

export const WD_CAPABILITIES = {
    "acceptInsecureCerts": false,
    "browserName": "chrome",
    "browserVersion": "88.0.4324.146",
    "networkConnectionEnabled": false,
    "pageLoadStrategy": "normal",
    "platformName": "mac os x",
    "proxy": {},
    "setWindowRect": true,
    "strictFileInteractability": false,
    "timeouts": {
        "implicit": 0,
        "pageLoad": 300000,
        "script": 30000
    },
    "unhandledPromptBehavior": "dismiss and notify",
    "webauthn:virtualAuthenticators": true
}

export const WD_START_SESSION_RESPONSE = { 
    OK : {
        code : 200,
        body : {
            value : {
                sessionId : WD_SESSION_ID,
                capabilities : WD_CAPABILITIES
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_EMPTY : {
        code : 200,
        body : { },
        headers : { "Content-Type" : "application/json"}
    },
    KO_VALUE_NULL : {
        code : 200,
        body : {
            //@ts-ignore
            value  : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_VALUE_EMPTY : {
        code : 200,
        body : {
            value  : {}
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_VALUE_NO_CAPA : {
        code : 200,
        body : {
            value  : {
                'sessionId' : WD_SESSION_ID
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_VALUE_NO_TIMEOUTS : {
        code : 200,
        body : {
            value  : {
                'sessionId' : WD_SESSION_ID,
                'capabilities' : {

                }
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOJSON : {
        code : 200,
        body : "<div>Hello World</div>",
        headers : { "Content-Type" : "application/json"}
    },
    KO_HTML : {
        code : 200,
        body : "<div>Hello World</div>",
        headers : { "Content-Type" : "application/html"}
    },
    KO_500 : {
        code : 500,
        body : {
            "value" : { 
                "error" : "session", 
                "message" : "can't create a session, test of CI",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}        
    }
}

export const WD_STOP_SESSION_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 500,
        body : {
            "value" : { 
                "error" : "session", 
                "message" : "this is an unknown error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }  
}

export const WD_FIND_ELEMENT_RESPONSE = {
    OK : {
        code : 200,
        body : {
            "value" : { 
                "element-6066-11e4-a52e-4f735466cecf": WD_ELEMENT_ID
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error": "no such element",
                "message": "no such element: Unable to locate element: {\"method\":\"method\",\"selector\":\"value\"}\n",
                "stacktrace" : "test stacktrace"
            }
        },
        headers : { "Content-Type" : "application/json"}        
    },
    KO_ERROR : {
        code : 500,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "this is an unknown error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }
}

export const WD_FIND_ELEMENT_FROM_ELEMENT_RESPONSE = WD_FIND_ELEMENT_RESPONSE;

export const WD_FIND_ELEMENTS_RESPONSE = {
    OK : {
        code : 200,
        body : {
            "value" : [{ 
                "element-6066-11e4-a52e-4f735466cecf": WD_ELEMENT_ID
            }]
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error": "no such element",
                "message": "no such element: Unable to locate element: {\"method\":\"method\",\"selector\":\"value\"}\n",
                "stacktrace" : "test stacktrace"
            }
        },
        headers : { "Content-Type" : "application/json"}        
    },
    KO_ERROR : {
        code : 500,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "this is an unknown error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }
}

export const WD_FIND_ELEMENT_FROM_ELEMENTS_RESPONSE = WD_FIND_ELEMENTS_RESPONSE;

export const WD_EXECUTE_SYNC_RESPONSE = {
    OK_NUMBER : {
        code : 200,
        body : {
            "value" : 10
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_STRING : {
        code : 200,
        body : {
            "value" : "hello"
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_ARRAY : {
        code : 200,
        body : {
            "value" : [1, 2, 3]
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_ELEMENT : {
        code : 200,
        body : {
            "value" : { 
                "element-6066-11e4-a52e-4f735466cecf": WD_ELEMENT_ID
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 500,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "this is an unknown error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }
}

export const WD_EXECUTE_ASYNC_RESPONSE = WD_EXECUTE_SYNC_RESPONSE;

export const WD_NAVIGATE_TO_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json" }
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "navigate", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_NAVIGATE_CURRENTURL = {
    OK : {
        code : 200,
        body : {
            "value" : WD_WEBSITE_URL_HTTP
        },
        headers : { "Content-Type" : "application/json" }
    },
    OK_1 : {
        code : 200,
        body : {
            "value" : WD_WEBSITE_URL_HTTP
        },
        headers : { "Content-Type" : "application/json" }
    },
    OK_2 : {
        code : 200,
        body : {
            "value" : WD_WEBSITE_URL_HTTP
        },
        headers : { "Content-Type" : "application/json" }
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "geturl", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_NAVIGATE_REFRESH_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json" }
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "refresh", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}


export const WD_NAVIGATE_BACK_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json" }
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "back", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}


export const WD_NAVIGATE_FORWARD_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json" }
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "forward", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_WINDOW_HANDLE_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : WD_WINDOW_ID
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 404,
        body : {
            "value" : { 
                "error" : "handle", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_WINDOW_HANDLES_RESPONSE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : [WD_WINDOW_ID , WD_WINDOW_ID]
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 500,
        body : {
            "value" : { 
                "error" : "handle", 
                "message" : "internal server error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_WINDOW_OPEN = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : WD_WINDOW2_ID
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 500,
        body : {
            "value" : { 
                "error" : "handle", 
                "message" : "internal server error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_CLICK = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_CLEAR = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_SENDKEYS = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_GETTEXT = {
    OK : {
        code : 200,
        body : {
            "value" : "Hello"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_GETVALUE = {
    OK : {
        code : 200,
        body : {
            "value" : "hello"
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_UPDATED : {
        code : 200,
        body : {
            "value" : "hellototo"
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_CLEARED : {
        code : 200,
        body : {
            "value" : ""
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}


export const WD_ELEMENT_GETATTRIBUTE = {
    OK : {
        code : 200,
        body : {
            "value" : "hello"
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_UPDATED : {
        code : 200,
        body : {
            "value" : "hello"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_GETPROPERTY = {
    OK : {
        code : 200,
        body : {
            "value" : "hello"
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_UPDATED : {
        code : 200,
        body : {
            "value" : "hellototo"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}


export const WD_ELEMENT_GETTAGNAME = {
    OK : {
        code : 200,
        body : {
            "value" : "input"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_GETCSSVALUE = {
    OK : {
        code : 200,
        body : {
            "value" : "center"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_ISSELECTED = {
    OK : {
        code : 200,
        body : {
            "value" : true
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_FALSE : {
        code : 200,
        body : {
            "value" : false
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_ISENABLED= {
    OK : {
        code : 200,
        body : {
            "value" : true
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_FALSE : {
        code : 200,
        body : {
            "value" : false
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_ELEMENT_SCREENSHOT= {
    OK : {
        code : 200,
        body : {
            "value" : "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"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_NOT_FOUND : {
        code : 404,
        body : {
            "value" : { 
                "error" : "element", 
                "message" : "element not found",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_WINDOW_GETTITLE= {
    OK : {
        code : 200,
        body : {
            "value" : "WD2 Test Page"
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 500,
        body : {
            "value" : { 
                "error" : "window", 
                "message" : "internal server error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const  WD_WINDOW_SETSIZE = (width, height) => {
    return {
        OK : {
            code : 200,
            body : {
                "value" :  {
                    "height": width,
                    "width": height,
                    "x": 0,
                    "y": 0
                }
            },
            headers : { "Content-Type" : "application/json"}
        },
        KO : {
            code : 500,
            body : {
                "value" : { 
                    "error" : "window", 
                    "message" : "internal server error",
                    "stacktrace" : "this is a stack\ntrace"
                }
            },
            headers : { "Content-Type" : "application/json" }
        }
    }
}

export const WD_WINDOW_GETSIZE = {
    OK : {
        code : 200,
        body : {
            "value" :  {
                "height": 1280,
                "width": 720,
                "x": 0,
                "y": 0
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 500,
        body : {
            "value" : { 
                "error" : "window", 
                "message" : "internal server error",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_WINDOW_SWITCH = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            "value" : WD_WINDOW2_ID
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 404,
        body : {
            "value" : { 
                "error" : "handle", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}


export const  WD_WINDOW_MAXIMIZE = {
        OK : {
            code : 200,
            body : {
                "value" :  {
                    "height": 1920,
                    "width": 1080,
                    "x": 0,
                    "y": 0
                }
            },
            headers : { "Content-Type" : "application/json"}
        },
        KO : {
            code : 500,
            body : {
                "value" : { 
                    "error" : "window", 
                    "message" : "internal server error",
                    "stacktrace" : "this is a stack\ntrace"
                }
            },
            headers : { "Content-Type" : "application/json" }
        }
}

export const WD_WINDOW_MINIMIZE = WD_WINDOW_MAXIMIZE;

export const WD_WINDOW_FULLSCREEN = WD_WINDOW_MAXIMIZE;

export const  WD_WINDOW_CLOSE = {
    OK : {
        code : 200,
        body : {
            "value" : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "window", 
                "message" : "no such windows",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_COOKIE_GET = {
    OK : {
        code : 200,
        body : {
            "value" : {
                "name" : "cookie1",
                "value" :  "test"
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_2 : {
        code : 200,
        body : {
            "value" : {
                "name" : "cookie2",
                "value" :  "hello"
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_3 : {
        code : 200,
        body : {
            "value" : {
                "name" : "cookie3",
                "value" :  "toto"
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_UPDATE : {
        code : 200,
        body : {
            "value" : {
                "name" : "cookie1",
                "value" :  "toto"
            }
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 404,
        body : {
            "value" : { 
                "error" : "no such cookie", 
                "message" : "no such cookie",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_COOKIE_GETALL = {
    OK : {
        code : 200,
        body : {
            "value" : [
                { "name" : "cookie1", "value" :  "test"},
                { "name" : "cookie2", "value" :  "hello"},
            ]
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 404,
        body : {
            "value" : { 
                "error" : "no such cookie", 
                "message" : "no such cookie",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json" }
    }
}

export const WD_COOKIE_DELETE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 404,
        body : {
            "value" : { 
                "error" : "no such cookie", 
                "message" : "no such cookie",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }  
}

export const WD_COOKIE_DELETE_ALL = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 400,
        body : {
            "value" : { 
                "error" : "no such window", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }  
}

export const WD_COOKIE_CREATE = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO_ERROR : {
        code : 400,
        body : {
            "value" : { 
                "error" : "no such window", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }  
}

export const WD_FRAME_SWITCH = {
    OK_1 : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_2 : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    OK_FRAME_ID : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "no such frame", 
                "message" : "no such frame",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }  
}

export const WD_FRAME_PARENT = {
    OK : {
        code : 200,
        body : {
            //@ts-ignore
            value : null
        },
        headers : { "Content-Type" : "application/json"}
    },
    KO : {
        code : 400,
        body : {
            "value" : { 
                "error" : "no such window", 
                "message" : "no such window",
                "stacktrace" : "this is a stack\ntrace"
            }
        },
        headers : { "Content-Type" : "application/json"}       
    }  
}