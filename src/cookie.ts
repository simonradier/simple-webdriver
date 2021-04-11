import { CookieDef } from "./interface";
import { WindowRect } from "./interface/window-rect";
import { WebDriver } from "./swd"

export class Cookie implements CookieDef {
    public readonly name: string;
    public readonly value: string;
    public readonly path: string;
    public readonly domain: string;
    public readonly secure: boolean;
    public readonly httpOnly: boolean;
    public readonly expiry: number;
    public readonly sameSite: string;

    constructor (driver : WebDriver, cookie : CookieDef) {
        this.name = cookie.name;
        this.value = cookie.value;
        this.path = cookie.path;
        this.domain = cookie.domain;
        this.secure = cookie.secure;
        this.httpOnly = cookie.httpOnly;
        this.sameSite = cookie.sameSite;
    }

}
