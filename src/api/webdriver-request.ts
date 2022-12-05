import { RequestOptions } from 'http'
import { RequestDef } from '../interface'

export class WebDriverRequest implements RequestDef {
  public requestOptions: RequestOptions
  public data: any = null
  public path: string
}
