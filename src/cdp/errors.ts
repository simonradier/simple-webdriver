export class CDPNotImplementedError extends Error {
  constructor(message = 'CDP protocol support is not yet implemented') {
    super(message)
    this.name = 'CDPNotImplementedError'
  }
}
