#!/usr/bin/env node
// Minimal fake Chromium debugger used by the launcher + CDP driver tests.
//
// Responds to:
//   GET  /json/version    — returns Browser/Protocol-Version/webSocketDebuggerUrl
//   WS   /devtools/...    — echoes a minimal subset of CDP commands used by
//                           CDPDriver.startSession / stopSession
//
// Stays alive until SIGTERM.
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

let port = 0
for (const arg of process.argv.slice(2)) {
  const m = /^--remote-debugging-port=(\d+)$/.exec(arg)
  if (m) port = parseInt(m[1], 10)
}
if (!port) {
  console.error('fake-browser: missing --remote-debugging-port=N')
  process.exit(1)
}

const wsPath = '/devtools/browser/fake-id'
const wsUrl = `ws://127.0.0.1:${port}${wsPath}`

const http = createServer((req, res) => {
  if (req.url === '/json/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        Browser: 'FakeChrome/1.0.0',
        'Protocol-Version': '1.3',
        webSocketDebuggerUrl: wsUrl
      })
    )
    return
  }
  res.writeHead(404).end()
})

const wss = new WebSocketServer({ server: http, path: wsPath })

wss.on('connection', ws => {
  let nextTargetId = 1
  let nextSessionId = 1
  ws.on('message', raw => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }
    const id = msg.id
    const method = msg.method
    let result = {}
    switch (method) {
      case 'Target.createTarget':
        result = { targetId: `target-${nextTargetId++}` }
        break
      case 'Target.attachToTarget':
        result = { sessionId: `session-${nextSessionId++}` }
        break
      case 'Target.closeTarget':
        result = { success: true }
        break
      case 'Page.enable':
      case 'Runtime.enable':
      case 'DOM.enable':
      case 'Network.enable':
        result = {}
        break
      default:
        // echo
        result = { echoed: method, params: msg.params }
    }
    const reply = { id, result }
    if (msg.sessionId) reply.sessionId = msg.sessionId
    ws.send(JSON.stringify(reply))
  })
})

http.listen(port, '127.0.0.1')

const shutdown = () => {
  wss.close()
  http.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 500).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
