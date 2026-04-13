import { Blob } from 'buffer'
import { createRequire } from 'module'
import type * as httpTypes from 'http'
import type * as httpsTypes from 'https'

// Use createRequire to load http/https as CJS modules.
// This ensures the returned objects are mutable, allowing
// test libraries like nock to intercept requests.
const require = createRequire(import.meta.url)
const http = require('http') as typeof httpTypes
const https = require('https') as typeof httpsTypes

export class HttpResponse<T> {
  body: T
  url: string
  statusCode: number
  statusMessage: string
}

export async function call<T>(
  url: string,
  httpOptions: httpTypes.RequestOptions | httpsTypes.RequestOptions,
  body: any = null
): Promise<HttpResponse<T>> {
  return new Promise<HttpResponse<any>>((resolve, reject) => {
    let req: httpTypes.ClientRequest
    const sBody = JSON.stringify(body)
    httpOptions.timeout = 1000 * 10
    if (body)
      httpOptions.headers['Content-Length'] = new Blob([sBody]).size
    if (url.startsWith('https://')) {
      req = https.request(url, httpOptions)
    } else {
      req = http.request(url, httpOptions)
    }
    req.on('response', res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        const response = new HttpResponse<T>()
        if (res.statusCode == 302 || res.statusCode == 303) {
          const err = new Error('HTTPError : Unsupported 302/303 redirection')
          reject(err)
          return
        }
        response.statusCode = res.statusCode
        response.statusMessage = res.statusMessage
        const contentType = res?.headers['content-type'] ?? res?.headers['Content-Type']
        if (!contentType?.includes('application/json')) {
          const err = new Error(
            "HTTPError : Incorrect HTTP header 'content-type', expected 'application/json'"
          )
          reject(err)
        } else {
          try {
            response.body = JSON.parse(data)
            response.url = url
            resolve(response)
          } catch (err) {
            reject(err)
          }
        }
      })
      res.on('error', err => {
        reject(err)
      })
    })
    req.on('error', err => {
      reject(err)
    })
    if (body) {
      req.write(sBody)
    }
    req.end()
  })
}
