import { expect } from 'chai'
import { WebSocketServer, WebSocket as WsServerSocket } from 'ws'
import { CDPClient } from '../../src/cdp/cdp-client.js'
import type { CDPEvent } from '../../src/cdp/cdp-client.js'
import { CDPConnectionError, CDPProtocolError } from '../../src/cdp/errors.js'
import { getFreePort } from '../../src/cdp/browser-launcher.js'

async function startServer(
  handler: (ws: WsServerSocket) => void
): Promise<{ port: number; close: () => Promise<void> }> {
  const port = await getFreePort()
  const server = new WebSocketServer({ port, host: '127.0.0.1' })
  server.on('connection', handler)
  await new Promise<void>(resolve => server.on('listening', () => resolve()))
  return {
    port,
    close: () =>
      new Promise(resolve =>
        server.close(() => resolve())
      )
  }
}

describe('CDPClient', function () {
  this.timeout(5_000)

  it('connects, sends a command and resolves with result', async function () {
    const srv = await startServer(ws => {
      ws.on('message', data => {
        const msg = JSON.parse(String(data))
        ws.send(
          JSON.stringify({
            id: msg.id,
            result: { echoed: msg.method, params: msg.params }
          })
        )
      })
    })
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      await client.connect()
      const res = await client.send<{ echoed: string; params: any }>(
        'Page.enable',
        { flag: true }
      )
      expect(res.echoed).to.equal('Page.enable')
      expect(res.params).to.deep.equal({ flag: true })
      await client.close()
    } finally {
      await srv.close()
    }
  })

  it('rejects with CDPProtocolError when the server returns an error', async function () {
    const srv = await startServer(ws => {
      ws.on('message', data => {
        const msg = JSON.parse(String(data))
        ws.send(
          JSON.stringify({
            id: msg.id,
            error: { code: -32601, message: 'Method not found' }
          })
        )
      })
    })
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      await client.connect()
      let caught: unknown
      try {
        await client.send('Nope.nope')
      } catch (e) {
        caught = e
      }
      expect(caught).to.be.instanceOf(CDPProtocolError)
      expect((caught as CDPProtocolError).code).to.equal(-32601)
      expect((caught as CDPProtocolError).method).to.equal('Nope.nope')
      expect((caught as CDPProtocolError).message).to.match(/Method not found/)
      await client.close()
    } finally {
      await srv.close()
    }
  })

  it('delivers events to registered handlers', async function () {
    const srv = await startServer(ws => {
      setImmediate(() =>
        ws.send(
          JSON.stringify({
            method: 'Page.loadEventFired',
            params: { timestamp: 123 }
          })
        )
      )
    })
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      const received: CDPEvent[] = []
      client.on('Page.loadEventFired', e => received.push(e))
      await client.connect()
      await new Promise(r => setTimeout(r, 50))
      expect(received).to.have.length(1)
      expect(received[0].params.timestamp).to.equal(123)
      await client.close()
    } finally {
      await srv.close()
    }
  })

  it('wildcard handler receives every event', async function () {
    const srv = await startServer(ws => {
      setImmediate(() => {
        ws.send(JSON.stringify({ method: 'A', params: {} }))
        ws.send(JSON.stringify({ method: 'B', params: {} }))
      })
    })
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      const seen: string[] = []
      client.on('*', e => seen.push(e.method))
      await client.connect()
      await new Promise(r => setTimeout(r, 50))
      expect(seen).to.deep.equal(['A', 'B'])
      await client.close()
    } finally {
      await srv.close()
    }
  })

  it('preserves sessionId on the wire and in events', async function () {
    const srv = await startServer(ws => {
      ws.on('message', data => {
        const msg = JSON.parse(String(data))
        ws.send(
          JSON.stringify({
            id: msg.id,
            sessionId: msg.sessionId,
            result: { session: msg.sessionId }
          })
        )
      })
    })
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      await client.connect()
      const res = await client.send<{ session: string }>('X.y', {}, 'session-42')
      expect(res.session).to.equal('session-42')
      await client.close()
    } finally {
      await srv.close()
    }
  })

  it('close() rejects all pending commands', async function () {
    const srv = await startServer(() => {
      /* never reply */
    })
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      await client.connect()
      const pending = client.send('Never.replies')
      await client.close()
      let caught: unknown
      try {
        await pending
      } catch (e) {
        caught = e
      }
      expect(caught).to.be.instanceOf(CDPConnectionError)
    } finally {
      await srv.close()
    }
  })

  it('connect() rejects when the URL is unreachable', async function () {
    const freePort = await getFreePort()
    const client = new CDPClient(`ws://127.0.0.1:${freePort}`)
    let caught: unknown
    try {
      await client.connect(1_000)
    } catch (e) {
      caught = e
    }
    expect(caught).to.be.instanceOf(CDPConnectionError)
  })

  it('send() after close throws CDPConnectionError', async function () {
    const srv = await startServer(() => undefined)
    try {
      const client = new CDPClient(`ws://127.0.0.1:${srv.port}`)
      await client.connect()
      await client.close()
      let caught: unknown
      try {
        await client.send('Foo.bar')
      } catch (e) {
        caught = e
      }
      expect(caught).to.be.instanceOf(CDPConnectionError)
    } finally {
      await srv.close()
    }
  })
})
