#!/usr/bin/env node
// Minimal fake Chromium-debugger used by the browser-launcher tests.
// Responds to GET /json/version only, then stays alive until SIGTERM.
import { createServer } from 'http'

let port = 0
for (const arg of process.argv.slice(2)) {
  const m = /^--remote-debugging-port=(\d+)$/.exec(arg)
  if (m) port = parseInt(m[1], 10)
}
if (!port) {
  console.error('fake-browser: missing --remote-debugging-port=N')
  process.exit(1)
}

const server = createServer((req, res) => {
  if (req.url === '/json/version') {
    const body = JSON.stringify({
      Browser: 'FakeChrome/1.0.0',
      'Protocol-Version': '1.3',
      webSocketDebuggerUrl: `ws://127.0.0.1:${port}/devtools/browser/fake-id`
    })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(body)
  } else {
    res.writeHead(404).end()
  }
})

server.listen(port, '127.0.0.1')

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
