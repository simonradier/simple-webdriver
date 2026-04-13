import * as httpclient from './utils/http-client.js'
import { ResponseDef, RequestDef } from './interface.js'
import { Logger } from './utils/logger.js'
import { WebDriverResponseError } from './error.js'

export async function call<T>(url: URL, request: RequestDef) {
  Logger.trace(`Calling : ${request.requestOptions.method} ${url}${request.path}`)
  try {
    const resp = await httpclient.call<ResponseDef<T>>(
      new URL(request.path, url.href).href,
      request.requestOptions,
      request.data
    )
    Logger.debug(request)
    Logger.debug(resp)
    if (resp.statusCode !== 200) {
      Logger.error(resp.body)
      throw new WebDriverResponseError(resp)
    } else {
      return resp
    }
  } catch (e) {
    throw e
  }
}

export * from './api/w3c.js'
export * from './api/webdriver-request.js'
