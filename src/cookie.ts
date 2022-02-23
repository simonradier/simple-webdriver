import { CookieDef } from "./interface";
import { Browser } from "./swd"

export class Cookie implements CookieDef {
    public readonly name: string;
    public value: string;
    public readonly path: string;
    public readonly domain: string;
    public readonly secure: boolean;
    public readonly httpOnly: boolean;
    public expiry: number;
    public readonly sameSite: string;
    public readonly browser: Browser;

    public get session () : string {
        return this.browser.session;
    };


    constructor (browser : Browser, cookie : CookieDef) {
        this.name = cookie.name;
        this.value = cookie.value;
        this.path = cookie.path;
        this.domain = cookie.domain;
        this.secure = cookie.secure;
        this.httpOnly = cookie.httpOnly;
        this.sameSite = cookie.sameSite;
        this.browser = browser;
    }

    /**
     * Create the cookie for the current browser
     */
    public async set () {
        await this.browser.cookie().create(this);
    }

    public async update () {
        await this.browser.cookie().update(this);
    }

    public async delete () {
        await this.browser.cookie().delete(this);
    }

}
