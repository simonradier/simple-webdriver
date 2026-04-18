import { ChildProcess, spawn } from 'child_process'
import { existsSync } from 'fs'
import { mkdtemp, rm } from 'fs/promises'
import * as net from 'net'
import * as os from 'os'
import * as path from 'path'
import { Logger } from '../utils/logger.js'
import { CDPBrowser, CDPOptions } from './options.js'

export interface BrowserVersionInfo {
  Browser: string
  'Protocol-Version': string
  webSocketDebuggerUrl: string
  [key: string]: any
}

export interface LaunchedBrowser {
  process: ChildProcess
  port: number
  debugUrl: string
  wsEndpoint: string
  userDataDir: string
  close(): Promise<void>
}

const DEFAULT_ARGS: readonly string[] = [
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-default-apps',
  '--disable-popup-blocking',
  '--disable-translate',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-features=Translate,BackForwardCache'
]

const READINESS_TIMEOUT_MS = 30_000
const READINESS_POLL_MS = 100
const GRACEFUL_SHUTDOWN_MS = 5_000

export async function launch(options: CDPOptions = {}): Promise<LaunchedBrowser> {
  const browser: CDPBrowser = options.browser ?? 'chrome'
  const executable = resolveExecutable(browser, options.executablePath)
  const port = options.port ?? (await getFreePort())

  const usingTempDir = !options.userDataDir
  const userDataDir =
    options.userDataDir ?? (await mkdtemp(path.join(os.tmpdir(), 'swd-cdp-')))

  const args = [
    ...DEFAULT_ARGS,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`
  ]
  if (options.headless) args.push('--headless=new')
  if (options.args) args.push(...options.args)
  args.push('about:blank')

  Logger.debug(`Launching ${browser} at ${executable} on port ${port}`)

  const proc = spawn(executable, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  })

  proc.stderr?.on('data', chunk =>
    Logger.trace(`[${browser}] ${chunk.toString().trim()}`)
  )

  let exited = false
  proc.once('exit', () => {
    exited = true
  })

  const cleanupTempDir = async () => {
    if (usingTempDir) {
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {})
    }
  }

  try {
    const version = await waitForDebugger(port, READINESS_TIMEOUT_MS, () => exited)
    return {
      process: proc,
      port,
      debugUrl: `http://127.0.0.1:${port}`,
      wsEndpoint: version.webSocketDebuggerUrl,
      userDataDir,
      async close() {
        if (exited) {
          await cleanupTempDir()
          return
        }
        proc.kill('SIGTERM')
        const killed = await waitForExit(proc, GRACEFUL_SHUTDOWN_MS)
        if (!killed) {
          Logger.warn(`${browser} did not exit after SIGTERM, sending SIGKILL`)
          proc.kill('SIGKILL')
          await waitForExit(proc, GRACEFUL_SHUTDOWN_MS)
        }
        await cleanupTempDir()
      }
    }
  } catch (err) {
    if (!exited) proc.kill('SIGKILL')
    await cleanupTempDir()
    throw err
  }
}

async function waitForDebugger(
  port: number,
  timeoutMs: number,
  isExited: () => boolean
): Promise<BrowserVersionInfo> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown = null
  while (Date.now() < deadline) {
    if (isExited()) {
      throw new Error('Browser process exited before the debugger became ready')
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
        signal: AbortSignal.timeout(1_000)
      })
      if (res.ok) {
        return (await res.json()) as BrowserVersionInfo
      }
      lastError = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastError = e
    }
    await sleep(READINESS_POLL_MS)
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for browser debugger on port ${port}` +
      (lastError ? ` — last error: ${String(lastError)}` : '')
  )
}

function waitForExit(proc: ChildProcess, timeoutMs: number): Promise<boolean> {
  return new Promise(resolve => {
    if (proc.exitCode !== null || proc.signalCode !== null) {
      resolve(true)
      return
    }
    const t = setTimeout(() => resolve(false), timeoutMs)
    proc.once('exit', () => {
      clearTimeout(t)
      resolve(true)
    })
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Failed to allocate a free port'))
        return
      }
      const { port } = address
      server.close(() => resolve(port))
    })
  })
}

export function resolveExecutable(browser: CDPBrowser, explicit?: string): string {
  if (explicit) {
    if (!existsSync(explicit)) {
      throw new Error(`Browser executable not found at "${explicit}"`)
    }
    return explicit
  }
  const candidates = getCandidatePaths(browser)
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate
  }
  throw new Error(
    `Could not locate a ${browser} binary. Pass options.executablePath explicitly. Tried:\n` +
      candidates.filter(Boolean).map(c => '  - ' + c).join('\n')
  )
}

export function getCandidatePaths(browser: CDPBrowser): string[] {
  switch (process.platform) {
    case 'darwin':
      return macCandidates(browser)
    case 'linux':
      return linuxCandidates(browser)
    case 'win32':
      return windowsCandidates(browser)
    default:
      return []
  }
}

function macCandidates(browser: CDPBrowser): string[] {
  switch (browser) {
    case 'chrome':
      return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    case 'chromium':
      return ['/Applications/Chromium.app/Contents/MacOS/Chromium']
    case 'msedge':
      return ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
  }
}

function linuxCandidates(browser: CDPBrowser): string[] {
  switch (browser) {
    case 'chrome':
      return [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/opt/google/chrome/chrome'
      ]
    case 'chromium':
      return ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium']
    case 'msedge':
      return ['/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable']
  }
}

function windowsCandidates(browser: CDPBrowser): string[] {
  const pf = process.env['PROGRAMFILES']
  const pf86 = process.env['PROGRAMFILES(X86)']
  const local = process.env['LOCALAPPDATA']
  switch (browser) {
    case 'chrome':
      return [
        pf && `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
        pf86 && `${pf86}\\Google\\Chrome\\Application\\chrome.exe`,
        local && `${local}\\Google\\Chrome\\Application\\chrome.exe`
      ].filter((p): p is string => !!p)
    case 'chromium':
      return [local && `${local}\\Chromium\\Application\\chrome.exe`].filter(
        (p): p is string => !!p
      )
    case 'msedge':
      return [
        pf && `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
        pf86 && `${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`
      ].filter((p): p is string => !!p)
  }
}
