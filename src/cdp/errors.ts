export class CDPNotImplementedError extends Error {
  constructor(message = 'CDP protocol support is not yet implemented') {
    super(message)
    this.name = 'CDPNotImplementedError'
  }
}

export class CDPConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CDPConnectionError'
  }
}

export class CDPProtocolError extends Error {
  public readonly method: string
  public readonly code: number
  public readonly data?: unknown

  constructor(method: string, code: number, message: string, data?: unknown) {
    super(`CDP ${method} failed: ${message} (code ${code})`)
    this.name = 'CDPProtocolError'
    this.method = method
    this.code = code
    this.data = data
  }
}
