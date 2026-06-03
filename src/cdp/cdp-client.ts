import { Logger } from '../utils/logger.js'
import { CDPConnectionError, CDPProtocolError } from './errors.js'

export interface CDPEvent {
  method: string
  params: any
  sessionId?: string
}

export type CDPEventHandler = (event: CDPEvent) => void

interface Pending {
  method: string
  resolve: (value: any) => void
  reject: (err: Error) => void
}

const defaultConnectTimeoutMs = 30_000

/**
 * Minimal Chrome DevTools Protocol client over WebSocket.
 * Talks to the browser debugger endpoint returned by /json/version
 * (or any target-level endpoint returned by attachToTarget flattening).
 *
 * Supports session-scoped commands via the CDP `sessionId` field.
 * No reconnection — fail-fast on lost connections.
 */
export class CDPClient {
  public readonly url: string
  private _ws: WebSocket | null = null
  private _nextId = 1
  private readonly _pending = new Map<number, Pending>()
  private readonly _handlers = new Map<string, Set<CDPEventHandler>>()
  private readonly _wildcardHandlers = new Set<CDPEventHandler>()
  private _closed = false

  constructor(url: string) {
    this.url = url
  }

  get connected(): boolean {
    return !!this._ws && this._ws.readyState === WebSocket.OPEN
  }

  async connect(timeoutMs: number = defaultConnectTimeoutMs): Promise<void> {
    if (this._ws) throw new CDPConnectionError('CDP client already connected')
    return new Promise<void>((resolve, reject) => {
      let settled = false
      const ws = new WebSocket(this.url)
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        try {
          ws.close()
        } catch {
          /* noop */
        }
        reject(new CDPConnectionError(`Timed out connecting to ${this.url}`))
      }, timeoutMs)

      ws.addEventListener('open', () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        this._ws = ws
        ws.addEventListener('message', this._onMessage)
        ws.addEventListener('close', () => this._onClose())
        ws.addEventListener('error', e => {
          Logger.debug(`CDP ws error: ${(e as any)?.message ?? String(e)}`)
        })
        resolve()
      })

      ws.addEventListener('error', e => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(
          new CDPConnectionError(
            `Failed to connect to ${this.url}: ${(e as any)?.message ?? String(e)}`
          )
        )
      })
    })
  }

  async send<T = any>(
    method: string,
    params: Record<string, any> = {},
    sessionId?: string
  ): Promise<T> {
    if (this._closed || !this._ws || this._ws.readyState !== WebSocket.OPEN) {
      throw new CDPConnectionError(`Cannot send "${method}": CDP client is not connected`)
    }
    const id = this._nextId++
    const payload: Record<string, any> = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    return new Promise<T>((resolve, reject) => {
      this._pending.set(id, { method, resolve, reject })
      this._ws!.send(JSON.stringify(payload))
    })
  }

  /**
   * Register an event listener. Pass '*' to match every event.
   * @returns an unsubscribe function.
   */
  on(method: string, handler: CDPEventHandler): () => void {
    if (method === '*') {
      this._wildcardHandlers.add(handler)
      return () => {
        this._wildcardHandlers.delete(handler)
      }
    }
    let set = this._handlers.get(method)
    if (!set) {
      set = new Set()
      this._handlers.set(method, set)
    }
    set.add(handler)
    return () => {
      set!.delete(handler)
    }
  }

  async close(): Promise<void> {
    if (this._closed) return
    this._closed = true
    const ws = this._ws
    this._ws = null
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      try {
        ws.close()
      } catch {
        /* noop */
      }
    }
    this._rejectAllPending(new CDPConnectionError('CDP client closed'))
  }

  private _onMessage = (event: MessageEvent) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString()
    let msg: any
    try {
      msg = JSON.parse(raw)
    } catch {
      Logger.warn(`CDP: received non-JSON frame (${raw.length} bytes)`)
      return
    }
    if (typeof msg.id === 'number') {
      const pending = this._pending.get(msg.id)
      if (!pending) return
      this._pending.delete(msg.id)
      if (msg.error) {
        pending.reject(
          new CDPProtocolError(
            pending.method,
            typeof msg.error.code === 'number' ? msg.error.code : -1,
            msg.error.message ?? 'unknown error',
            msg.error.data
          )
        )
      } else {
        pending.resolve(msg.result)
      }
      return
    }
    if (typeof msg.method === 'string') {
      const evt: CDPEvent = {
        method: msg.method,
        params: msg.params ?? {},
        sessionId: msg.sessionId
      }
      const set = this._handlers.get(msg.method)
      if (set) {
        for (const h of set) {
          try {
            h(evt)
          } catch (e) {
            Logger.warn(`CDP handler for ${msg.method} threw: ${String(e)}`)
          }
        }
      }
      for (const h of this._wildcardHandlers) {
        try {
          h(evt)
        } catch (e) {
          Logger.warn(`CDP wildcard handler threw: ${String(e)}`)
        }
      }
    }
  }

  private _onClose() {
    this._closed = true
    this._rejectAllPending(new CDPConnectionError('Connection closed'))
  }

  private _rejectAllPending(error: Error) {
    for (const { reject } of this._pending.values()) reject(error)
    this._pending.clear()
  }
}
