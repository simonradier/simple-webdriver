import * as http from "http";
import * as https from "https";


export class HttpResponse<T> {
    body : T;
    url : string;
    statusCode : number;
    statusMessage : string;
}


export async function call<T>(url : string, httpOptions : http.RequestOptions | https.RequestOptions, body : any = null) : Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<any>> ((resolve, reject) => {
        let req : http.ClientRequest;
        const sBody = JSON.stringify(body);
        httpOptions.timeout = 1000 * 10;
        if (body)
            httpOptions.headers['Content-Length'] = sBody.length;
        if (url.startsWith("https://")) {
                req = https.request(url, httpOptions);
        } else {
                req = http.request(url, httpOptions);
        }
        req.on('response', (res) => {
            let data = '';
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const response = new HttpResponse<T>();
                if (res.statusCode == 302 || res.statusCode == 303) {
                    const err = new Error("HTTPError : Unsupported 302/303 redirection")
                    reject(err);
                }
                response.statusCode = res.statusCode;
                response.statusMessage = res.statusMessage
                if (!res.headers || !(res.headers["content-type"] && res.headers["content-type"].includes("application/json"))) {
                    const err = new Error("HTTPError : Incorrect HTTP header 'content-type', expected 'application/json'")
                    reject(err);
                } else {
                    try {
                        response.body = JSON.parse(data);
                        response.url = url;
                        resolve(response);
                    } catch (err) {
                        reject(err);
                    }
                }
            });  
            res.on('error', (err) => {
                reject(err);
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
        if (body) {
            req.write(sBody);
        }
        req.end();
    });
}