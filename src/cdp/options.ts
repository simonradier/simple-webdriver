export type CDPBrowser = 'chrome' | 'chromium' | 'msedge'

export interface CDPOptions {
  browser?: CDPBrowser
  executablePath?: string
  port?: number
  args?: string[]
  headless?: boolean
  userDataDir?: string
}
