#!/usr/bin/env node
// Minimal fake Chromium debugger used by the launcher + CDP driver tests.
//
// Responds to GET /json/version and a CDP WebSocket endpoint at
// /devtools/browser/fake-id. Implements just enough of the protocol to
// satisfy the features landed in CDPDriver so far (lifecycle, navigation,
// runtime evaluate, ...).
//
// The fake tracks per-CDP-session state: currentUrl, title, frameId.
// Navigation emits Page.frameStoppedLoading with that sessionId so the
// driver-level "wait for load" logic is exercised.
//
// Extend handleCommand / deriveEvaluate as new features land.
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
  // Per-connection state.
  const sessions = new Map() // cdpSessionId -> { targetId, url, title, frameId }
  let nextTargetId = 1
  let nextSessionId = 1

  const send = obj => ws.send(JSON.stringify(obj))

  const emitEvent = (method, params, sessionId) => {
    const evt = { method, params }
    if (sessionId) evt.sessionId = sessionId
    send(evt)
  }

  const toRemoteObject = value => {
    if (value === null) return { type: 'object', subtype: 'null', value: null }
    const t = typeof value
    if (t === 'undefined') return { type: 'undefined' }
    if (t === 'string' || t === 'number' || t === 'boolean')
      return { type: t, value }
    return { type: 'object', value }
  }

  const runScript = async (expression, session) => {
    // Build a fake browsing environment tied to session state.
    const elements = session?.elements ?? new Map()
    const fakeWindow = {
      location: {
        get href() {
          return session?.url ?? 'about:blank'
        }
      }
    }
    const fakeDocument = {
      get title() {
        return session?.title ?? ''
      }
    }
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'window',
        'document',
        '__ELEMENTS__',
        `"use strict"; return (${expression});`
      )
      const value = await Promise.resolve(fn(fakeWindow, fakeDocument, elements))
      return { result: toRemoteObject(value) }
    } catch (e) {
      return {
        result: { type: 'undefined' },
        exceptionDetails: {
          text: e.message,
          exception: { description: e.message }
        }
      }
    }
  }

  const handleCommand = async msg => {
    const { id, method, params = {}, sessionId } = msg
    const session = sessionId ? sessions.get(sessionId) : null
    let result = {}
    switch (method) {
      case 'Target.createTarget':
        result = { targetId: `target-${nextTargetId++}` }
        break
      case 'Target.attachToTarget': {
        const newSid = `session-${nextSessionId++}`
        sessions.set(newSid, {
          targetId: params.targetId,
          url: 'about:blank',
          title: '',
          frameId: `frame-${newSid}`
        })
        result = { sessionId: newSid }
        break
      }
      case 'Target.closeTarget':
        result = { success: true }
        break
      case 'Page.enable':
      case 'Runtime.enable':
      case 'DOM.enable':
      case 'Network.enable':
        result = {}
        break
      case 'Page.navigate': {
        if (session) {
          session.url = params.url ?? session.url
          session.title = (params.url?.match(/title=([^&]+)/) ?? [])[1] ?? session.title
        }
        result = { frameId: session?.frameId ?? 'frame-x' }
        // Emit frameStoppedLoading shortly after.
        setImmediate(() =>
          emitEvent(
            'Page.frameStoppedLoading',
            { frameId: session?.frameId ?? 'frame-x' },
            sessionId
          )
        )
        break
      }
      case 'Page.reload':
        result = {}
        setImmediate(() =>
          emitEvent(
            'Page.frameStoppedLoading',
            { frameId: session?.frameId ?? 'frame-x' },
            sessionId
          )
        )
        break
      case 'Page.getNavigationHistory':
        result = {
          currentIndex: 0,
          entries: [
            {
              id: 1,
              url: session?.url ?? 'about:blank',
              userTypedURL: session?.url ?? 'about:blank',
              title: session?.title ?? '',
              transitionType: 'typed'
            }
          ]
        }
        break
      case 'Page.navigateToHistoryEntry':
        result = {}
        setImmediate(() =>
          emitEvent(
            'Page.frameStoppedLoading',
            { frameId: session?.frameId ?? 'frame-x' },
            sessionId
          )
        )
        break
      case 'Runtime.evaluate':
        result = await runScript(params.expression ?? 'undefined', session)
        break
      default:
        result = { echoed: method, params }
    }
    const reply = { id, result }
    if (sessionId) reply.sessionId = sessionId
    send(reply)
  }

  ws.on('message', async raw => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }
    try {
      await handleCommand(msg)
    } catch (e) {
      const reply = {
        id: msg?.id,
        error: { code: -32000, message: e?.message ?? String(e) }
      }
      if (msg?.sessionId) reply.sessionId = msg.sessionId
      send(reply)
    }
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
