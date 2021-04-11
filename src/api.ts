import * as httpclient from "./utils/http-client";
import { ResponseDef, RequestDef } from "./interface"
import { Logger } from "./utils/logger";
import { WebDriverResponseError } from "./error";
import { URL } from "url";

export async function call<T>(url : URL, request : RequestDef) {
    return new Promise<httpclient.HttpResponse<ResponseDef<T>>>(async (resolve, reject) => {
        Logger.trace(`Calling : ${ request.requestOptions.method }${ url }${ request.path }`);
        try {
            const resp = await httpclient.call<ResponseDef<T>>(new URL(request.path, url.href).href, request.requestOptions, request.data);
            Logger.debug(request);
            Logger.debug(resp);
            if (resp.statusCode !== 200 || (resp.body.status && resp.body.status !== 0)) {
                reject(new WebDriverResponseError(resp));
            } else {
                resolve(resp);
            }
        } catch (e) {
            reject(e);
        }
    })

}

export * from "./api/jsonwire"
export * from "./api/w3c"
export * from "./api/webdriver-request"