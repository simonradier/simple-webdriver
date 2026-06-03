// Polyfill globalThis.WebSocket when running the unit suite under Node < 22.4.
// The production runtime requires Node 22.4+ for WebDriver.cdp(), but the unit
// tests exercise the CDP client on the whole CI matrix (Node 20/22/24). We
// bridge the gap with the already-present-as-devDep `ws` package.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  const ws = await import('ws')
  // ws exports a WebSocket class that matches the browser API enough for
  // our CDPClient (addEventListener, send, readyState, OPEN static).
  ;(globalThis as { WebSocket?: unknown }).WebSocket = (ws as any).WebSocket
}
