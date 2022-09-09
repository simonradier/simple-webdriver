import { WDAPIDef, RequestDef } from "../interface";
import { CookieDef } from "../interface/cookie";
import { Logger } from "../utils/logger";
import { WebDriverRequest } from "./webdriver-request";

export class W3C implements WDAPIDef {

    private static _initHttpOptions(request: RequestDef) {
        request.requestOptions = {};
        request.requestOptions.headers = {
            "Content-Type": "application/json;charset=utf-8",
            "Cache-Control": "no-cache"
        }
    }

    SESSION_START(browser: string, args: string[]): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.data = {
            capabilities: {
                alwaysMatch : {
                    browserName: browser
                }
            }
        };
        let browserOptions = "browserOptions";
        switch (browser) {
            case "chrome":
            case "chromium":
                browserOptions = "goog:chromeOptions";
            break
            case "firefox" :
                browserOptions = "moz:firefoxOptions";
            break
            case "msedge" : 
                browserOptions = "ms:edgeOptions";
            break;
            case "safari":
                browserOptions = "safari:options";
        }
        if (args.some(arg => arg.includes("headless"))) {
            switch (browser) {
                case "msedge" :
                case "chrome" :
                case "chromium":
                case "firefox" :
                break
                default: 
                    Logger.warn("headless feature is not supported by : " + browser)
            }
        }
        result.data.capabilities.alwaysMatch[browserOptions] = { args };
        //result.data.capabilities.alwaysMatch[browserOptions].w3c = true;
        result.path = "session";
        result.requestOptions.method = "POST"
        return result;
    }

    SESSION_STOP(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}`;
        result.requestOptions.method = "DELETE"
        return result;
    }

    NAVIGATE_TO(sessionId: string, url: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/url`;
        result.requestOptions.method = "POST"
        result.data = {}
        result.data = { url }
        return result;
    }

    NAVIGATE_CURRENTURL(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/url`;
        result.requestOptions.method = "GET"
        return result;    
    }

    NAVIGATE_REFRESH(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/refresh`;
        result.data = {}
        result.requestOptions.method = "POST"
        return result;
    }

    NAVIGATE_BACK(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/back`;
        result.data = {}
        result.requestOptions.method = "POST"
        return result;
    }

    NAVIGATE_FORWARD(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/forward`;
        result.data = {}
        result.requestOptions.method = "POST"
        return result;
    }

    GETTITLE(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/title`;
        result.requestOptions.method = "GET"
        return result;
    }

    WINDOW_GETHANDLE(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window`;
        result.requestOptions.method = "GET"
        return result;
    }

    WINDOW_GETHANDLES(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/handles`;
        result.requestOptions.method = "GET"
        return result;
    }

    
    WINDOW_CREATE(sessionId: string, type : "tab" | "window" = "tab"): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/new`;
        result.requestOptions.method = "POST";
        result.data = {
            type
        }
        return result;
    }


    WINDOW_SETRECT(sessionId: string, width: number, height: number): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/rect`;
        result.requestOptions.method = "POST"
        result.data = {
            width,
            height
        }
        return result;
    }

    WINDOW_GETRECT(sessionId: string) : RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/rect`;
        result.requestOptions.method = "GET"
        return result;
    }

    WINDOW_MAXIMIZE(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/maximize`;
        result.requestOptions.method = "POST"
        result.data = {}
        return result;
    }

    WINDOW_MINIMIZE(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/minimize`;
        result.requestOptions.method = "POST"
        result.data = {}
        return result;
    }

    WINDOW_FULLSCREEN(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window/fullscreen`;
        result.requestOptions.method = "POST"
        result.data = {}
        return result;
    }

    WINDOW_CLOSE(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window`;
        result.requestOptions.method = "DELETE"
        return result;
    }

    WINDOW_SWITCH(sessionId: string, handle: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/window`;
        result.requestOptions.method = "POST"
        result.data = { handle }
        return result;
    }

    SCREENSHOT(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/screenshot`;
        result.requestOptions.method = "GET"
        return result;
    }

    FRAME_SWITCH(sessionId: string, frameId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/frame`;
        result.requestOptions.method = "POST"
        result.data = { id: frameId }
        return result;
    }

    FRAME_TOPARENT(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/frame/parent`;
        result.requestOptions.method = "POST"
        result.data = {}
        return result;
    }

    FINDELEMENT(sessionId: string, using: string, value: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element`;
        result.requestOptions.method = "POST"
        result.data = { using, value }
        return result;
    }

    FINDELEMENTS(sessionId: string, using: string, value: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/elements`;
        result.requestOptions.method = "POST"
        result.data = { using, value }
        return result;
    }

    GETACTIVEELEMENT(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/active`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_FINDELEMENT(sessionId: string, element: string, using: string, value: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${element}/element`;
        result.requestOptions.method = "POST"
        result.data = { using, value }
        return result;
    }

    ELEMENT_FINDELEMENTS(sessionId: string, element: string, using: string, value: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${element}/elements`;
        result.requestOptions.method = "POST"
        result.data = { using, value }
        return result;
    }

    ELEMENT_GETATTRIBUTE(sessionId: string, elementId: string, attribute: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/attribute/${attribute}`;
        result.requestOptions.method = "GET";
        return result;
    }

    ELEMENT_GETPROPERTY(sessionId: string, elementId: string, property: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/property/${property}`;
        result.requestOptions.method = "GET";
        return result;
    }

    ELEMENT_GETCSS(sessionId: string, elementId: string, cssProperty: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/css/${cssProperty}`;
        result.requestOptions.method = "GET";
        return result;
    }

    ELEMENT_GETTEXT(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/text`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_GETTAGNAME(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/name`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_GETRECT(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/rect`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_SCREENSHOT(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/screenshot`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_CLICK(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/click`;
        result.requestOptions.method = "POST"
        result.data = {}
        return result;
    }

    ELEMENT_CLEAR(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/clear`;
        result.requestOptions.method = "POST"
        result.data = {}
        return result;
    }

    ELEMENT_ISENABLED(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/enabled`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_ISSELECTED(sessionId: string, elementId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/selected`;
        result.requestOptions.method = "GET"
        return result;
    }

    ELEMENT_SENDKEYS(sessionId: string, elementId: string, keys: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/element/${elementId}/value`;
        result.requestOptions.method = "POST"
        result.data = { text: keys }
        return result;
    }

    EXECUTE_SYNC(sessionId: string, script: string, args: any[]): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/execute/sync`;
        result.requestOptions.method = "POST"
        result.data = { script, args }
        return result;
    }

    EXECUTE_ASYNC(sessionId: string, script: string, args: any[]): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/execute/async`;
        result.requestOptions.method = "POST"
        result.data = { script, args }
        return result;
    }

    COOKIE_GETALL(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/cookie`;
        result.requestOptions.method = "GET"
        return result;
    }

    COOKIE_GET(sessionId: string, name: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/cookie/${name}`;
        result.requestOptions.method = "GET"
        return result;
    }

    COOKIE_CREATE(sessionId: string, cookie : CookieDef): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/cookie`;
        result.requestOptions.method = "POST";
        result.data = {cookie : cookie};
        return result;
    }

    COOKIE_DELETE(sessionId: string, name: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/cookie/${name}`;
        result.requestOptions.method = "DELETE"
        return result;
    }

    COOKIE_DELETEALL(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/cookie`;
        result.requestOptions.method = "DELETE"
        return result;
    }

    ALERT_ACCEPT(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/alert/accept`;
        result.requestOptions.method = "POST"
        result.data = {};
        return result;
    }

    ALERT_DISMISS(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/alert/dismiss`;
        result.requestOptions.method = "POST"
        result.data = {};
        return result;
    }

    ALERT_GETTEXT(sessionId: string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/alert/text`;
        result.requestOptions.method = "GET"
        return result;
    }

    ALERT_SENDTEXT(sessionId: string, text : string): RequestDef {
        const result = new WebDriverRequest();
        W3C._initHttpOptions(result);
        result.path = `session/${sessionId}/alert/text`;
        result.requestOptions.method = "POST";
        result.data = { text }
        return result;
    }
}