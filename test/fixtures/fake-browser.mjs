#!/usr/bin/env node
// Minimal fake Chromium debugger used by the launcher + CDP driver tests.
//
// Responds to GET /json/version and a CDP WebSocket endpoint at
// /devtools/browser/fake-id. Implements just enough of the protocol to
// satisfy the features landed in CDPDriver so far.
//
// Each WebSocket connection holds:
//   - sessions: Map<cdpSessionId, { targetId, url, title, frameId,
//                                   window, document, elements,
//                                   cookies, timeouts, alert, frames }>
//   - an object-id table (for CDP Runtime.RemoteObject round-trips)
//
// The fake can evaluate real JavaScript expressions against a session-bound
// `window` / `document` / element set: tests can prime state (e.g. setCookie,
// push elements) and assertions run through the same code paths as the real
// browser would. A special CDP method "Fake.setup" lets tests inject state.
//
// Kept deliberately simple — extend handlers as features land.
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

class FakeEvent {
  constructor(type, init = {}) {
    this.type = type
    this.bubbles = !!init.bubbles
    this.cancelable = !!init.cancelable
    this.clientX = init.clientX ?? 0
    this.clientY = init.clientY ?? 0
  }
}

class FakeElement {
  constructor(tag, attrs = {}, children = [], text = '') {
    this.tagName = tag.toUpperCase()
    this.attributes = { ...attrs }
    this.children = children
    this._text = text
    this._value = attrs.value ?? ''
    this.__isFakeElement = true
    this._style = attrs._style ?? {}
    this.disabled = attrs.disabled !== undefined
    this.checked = !!attrs.checked
    this.selected = !!attrs.selected
  }
  get innerText() {
    return this.textContent
  }
  get textContent() {
    if (this.children.length === 0) return this._text
    return this._text + this.children.map(c => c.textContent).join('')
  }
  set textContent(v) {
    this._text = v
    this.children = []
  }
  get value() {
    return this._value
  }
  set value(v) {
    this._value = v
  }
  getAttribute(name) {
    return this.attributes[name] ?? null
  }
  setAttribute(name, v) {
    this.attributes[name] = v
  }
  hasAttribute(name) {
    return name in this.attributes
  }
  matches(sel) {
    sel = String(sel).trim()
    if (sel.startsWith('#')) return this.attributes.id === sel.slice(1)
    if (sel.startsWith('.')) {
      const cls = sel.slice(1)
      return (this.attributes.class ?? '').split(/\s+/).includes(cls)
    }
    return this.tagName === sel.toUpperCase()
  }
  all() {
    return [this, ...this.children.flatMap(c => c.all?.() ?? [c])]
  }
  querySelector(sel) {
    return this.all().find(e => e.matches(sel)) ?? null
  }
  querySelectorAll(sel) {
    return this.all().filter(e => e.matches(sel))
  }
  click() {
    this._clicked = (this._clicked ?? 0) + 1
  }
  focus() {
    this._focused = true
  }
  blur() {
    this._focused = false
  }
  scrollIntoView() {}
  dispatchEvent(evt) {
    this._events = this._events ?? []
    this._events.push(evt)
    return true
  }
  get isContentEditable() {
    return !!this.attributes.contenteditable
  }
  getBoundingClientRect() {
    return { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0 }
  }
  toJSON() {
    return { tag: this.tagName, attrs: this.attributes, text: this.textContent }
  }
}

wss.on('connection', ws => {
  const sessions = new Map()
  let nextTargetId = 1
  let nextSessionId = 1
  let nextObjectId = 1

  // Per-connection object table for Runtime.RemoteObject refs.
  const objectTable = new Map() // objectId -> { value, session }

  const send = obj => ws.send(JSON.stringify(obj))

  const emitEvent = (method, params, sessionId) => {
    const evt = { method, params }
    if (sessionId) evt.sessionId = sessionId
    send(evt)
  }

  const registerObject = (value, session) => {
    if (value && typeof value === 'object' && value.__cdpObjectId) {
      // Already registered
      return value.__cdpObjectId
    }
    const id = `obj-${nextObjectId++}`
    objectTable.set(id, { value, session })
    if (value && typeof value === 'object') {
      Object.defineProperty(value, '__cdpObjectId', {
        value: id,
        enumerable: false,
        writable: false
      })
    }
    return id
  }

  const toRemoteObject = (value, session, byValue) => {
    if (value === null) return { type: 'object', subtype: 'null', value: null }
    const t = typeof value
    if (t === 'undefined') return { type: 'undefined' }
    if (t === 'string' || t === 'number' || t === 'boolean')
      return { type: t, value }
    if (byValue) return { type: Array.isArray(value) ? 'object' : 'object', value }
    const objectId = registerObject(value, session)
    const remote = { type: 'object', objectId }
    if (value && value.__isFakeElement) remote.subtype = 'node'
    if (Array.isArray(value)) remote.subtype = 'array'
    return remote
  }

  const createSession = (targetId, sessionId) => {
    const state = {
      targetId,
      url: 'about:blank',
      title: '',
      frameId: `frame-${sessionId}`,
      elements: [], // top-level elements (can be mutated via Fake.setup)
      cookies: [],
      timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },
      alert: null,
      frames: { currentFrameId: null }
    }
    sessions.set(sessionId, state)
    return state
  }

  const makeGlobals = session => {
    const rootElements = session?.elements ?? []
    const asCollection = {
      all() {
        return rootElements.flatMap(e => e.all())
      },
      querySelector(sel) {
        return this.all().find(e => e.matches(sel)) ?? null
      },
      querySelectorAll(sel) {
        return this.all().filter(e => e.matches(sel))
      }
    }
    const fakeWindow = {
      location: {
        get href() {
          return session?.url ?? 'about:blank'
        }
      },
      getComputedStyle(el) {
        const src = el?._style ?? {}
        return {
          ...src,
          getPropertyValue(prop) {
            return src[prop] ?? ''
          }
        }
      }
    }
    const fakeDocument = {
      get title() {
        return session?.title ?? ''
      },
      querySelector(sel) {
        return asCollection.querySelector(sel)
      },
      querySelectorAll(sel) {
        return asCollection.querySelectorAll(sel)
      },
      evaluate(xpath, scope) {
        const all = (scope ?? asCollection).querySelectorAll('*')
        const match = simpleXpath(all, xpath)
        return {
          singleNodeValue: match[0] ?? null,
          snapshotLength: match.length,
          snapshotItem: i => match[i]
        }
      },
      get activeElement() {
        return rootElements.flatMap(e => e.all()).find(e => e._focused) ?? null
      },
      get documentElement() {
        return {
          outerHTML: rootElements.map(stringifyElement).join('')
        }
      }
    }
    return {
      window: fakeWindow,
      document: fakeDocument,
      XPathResult: { FIRST_ORDERED_NODE_TYPE: 9, ORDERED_NODE_SNAPSHOT_TYPE: 7 },
      Event: FakeEvent,
      MouseEvent: FakeEvent
    }
  }

  const evalIn = async (expression, session, byValue) => {
    const g = makeGlobals(session)
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'window',
        'document',
        'XPathResult',
        'Event',
        'MouseEvent',
        `"use strict"; return (${expression});`
      )
      const value = await Promise.resolve(
        fn(g.window, g.document, g.XPathResult, g.Event, g.MouseEvent)
      )
      return { result: toRemoteObject(value, session, byValue) }
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

  const callFunctionOn = async (functionDeclaration, objectId, args, session, byValue) => {
    const target = objectTable.get(objectId)
    if (!target) throw new Error(`Unknown objectId ${objectId}`)
    const resolvedArgs = (args ?? []).map(a => {
      if ('value' in a) return a.value
      if (a.objectId) return objectTable.get(a.objectId)?.value
      return undefined
    })
    const g = makeGlobals(session)
    try {
      // eslint-disable-next-line no-new-func
      const wrapper = new Function(
        'self',
        'args',
        'window',
        'document',
        'XPathResult',
        'Event',
        'MouseEvent',
        `"use strict"; return (${functionDeclaration}).apply(self, args);`
      )
      const value = await Promise.resolve(
        wrapper(
          target.value,
          resolvedArgs,
          g.window,
          g.document,
          g.XPathResult,
          g.Event,
          g.MouseEvent
        )
      )
      return { result: toRemoteObject(value, session, byValue) }
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
      case 'Fake.setup':
        // Test hook: inject state on a per-session basis.
        if (session) {
          if (params.elements)
            session.elements = params.elements.map(mkElement)
          if (params.url) session.url = params.url
          if (params.title) session.title = params.title
          if (params.cookies) session.cookies = params.cookies
        }
        result = {}
        break
      case 'Target.createTarget':
        result = { targetId: `target-${nextTargetId++}` }
        break
      case 'Target.attachToTarget': {
        const newSid = `session-${nextSessionId++}`
        createSession(params.targetId, newSid)
        result = { sessionId: newSid }
        break
      }
      case 'Target.closeTarget':
        result = { success: true }
        break
      case 'Target.getTargets':
        result = {
          targetInfos: Array.from(sessions.values()).map(s => ({
            targetId: s.targetId,
            type: 'page',
            url: s.url,
            title: s.title,
            attached: true
          }))
        }
        break
      case 'Page.enable':
      case 'Runtime.enable':
      case 'DOM.enable':
      case 'Network.enable':
        result = {}
        break
      case 'Page.navigate': {
        if (session) session.url = params.url ?? session.url
        if (session) {
          const titleMatch = (params.url ?? '').match(/title=([^&]+)/)
          if (titleMatch) session.title = decodeURIComponent(titleMatch[1])
        }
        result = { frameId: session?.frameId ?? 'frame-x' }
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
      case 'Page.getNavigationHistory':
        result = {
          currentIndex: 0,
          entries: [
            {
              id: 1,
              url: session?.url ?? 'about:blank',
              title: session?.title ?? '',
              userTypedURL: session?.url ?? 'about:blank',
              transitionType: 'typed'
            }
          ]
        }
        break
      case 'Page.captureScreenshot':
        result = { data: Buffer.from('fake-screenshot').toString('base64') }
        break
      case 'Page.printToPDF':
        result = { data: Buffer.from('fake-pdf').toString('base64') }
        break
      case 'Page.handleJavaScriptDialog':
        if (session) session.alert = null
        result = {}
        break
      case 'Runtime.evaluate':
        result = await evalIn(
          params.expression ?? 'undefined',
          session,
          !!params.returnByValue
        )
        break
      case 'Runtime.callFunctionOn':
        result = await callFunctionOn(
          params.functionDeclaration,
          params.objectId,
          params.arguments,
          session,
          !!params.returnByValue
        )
        break
      case 'Runtime.getProperties': {
        const entry = objectTable.get(params.objectId)
        if (!entry) {
          result = { result: [] }
          break
        }
        const props = []
        if (Array.isArray(entry.value)) {
          entry.value.forEach((v, i) => {
            props.push({
              name: String(i),
              value: toRemoteObject(v, entry.session, false)
            })
          })
          props.push({
            name: 'length',
            value: { type: 'number', value: entry.value.length }
          })
        } else if (entry.value && typeof entry.value === 'object') {
          for (const k of Object.keys(entry.value)) {
            props.push({
              name: k,
              value: toRemoteObject(entry.value[k], entry.session, false)
            })
          }
        }
        result = { result: props }
        break
      }
      case 'Runtime.releaseObject':
        objectTable.delete(params.objectId)
        result = {}
        break
      case 'DOM.getBoxModel':
        result = {
          model: {
            content: [0, 0, 100, 0, 100, 20, 0, 20],
            width: 100,
            height: 20
          }
        }
        break
      case 'DOM.scrollIntoViewIfNeeded':
        result = {}
        break
      case 'Input.dispatchMouseEvent':
      case 'Input.dispatchKeyEvent':
      case 'Input.dispatchTouchEvent':
        result = {}
        break
      case 'Network.getCookies':
        result = { cookies: session?.cookies ?? [] }
        break
      case 'Network.getAllCookies':
        result = { cookies: session?.cookies ?? [] }
        break
      case 'Network.setCookie': {
        if (session) {
          const existing = session.cookies.find(c => c.name === params.name)
          if (existing) Object.assign(existing, params)
          else session.cookies.push({ ...params })
        }
        result = { success: true }
        break
      }
      case 'Network.deleteCookies':
        if (session)
          session.cookies = session.cookies.filter(c => c.name !== params.name)
        result = {}
        break
      case 'Network.clearBrowserCookies':
        if (session) session.cookies = []
        result = {}
        break
      case 'Browser.getWindowForTarget':
        result = {
          windowId: 1,
          bounds: { left: 0, top: 0, width: 1024, height: 768, windowState: 'normal' }
        }
        break
      case 'Browser.setWindowBounds':
        result = {}
        break
      case 'Browser.getVersion':
        result = { product: 'FakeChrome/1.0.0', revision: 'rev-1' }
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

function mkElement(spec) {
  const children = (spec.children ?? []).map(mkElement)
  return new FakeElement(
    spec.tag ?? 'div',
    spec.attrs ?? {},
    children,
    spec.text ?? ''
  )
}

function simpleXpath(all, xpath) {
  // Extremely limited XPath. Supports //tag, //*[@attr='value'], //*[contains(text(),'x')]
  const tagMatch = /^\/\/(\w+)$/.exec(xpath)
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase()
    return all.filter(e => e.tagName === tag)
  }
  const attrMatch = /^\/\/\*\[@(\w+)=['"]([^'"]+)['"]\]$/.exec(xpath)
  if (attrMatch) {
    const [, a, v] = attrMatch
    return all.filter(e => e.attributes[a] === v)
  }
  return []
}

function stringifyElement(el) {
  const attrs = Object.entries(el.attributes)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('')
  const children = el.children.map(stringifyElement).join('')
  return `<${el.tagName.toLowerCase()}${attrs}>${el._text}${children}</${el.tagName.toLowerCase()}>`
}

http.listen(port, '127.0.0.1')

const shutdown = () => {
  wss.close()
  http.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 500).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
