#!/usr/bin/env node
/** Launch one clean Windows Chrome profile and retain its exact CDP endpoint
 * for the checked-in Browser Harness wrapper. The launcher retires only the
 * process tree, endpoint artifact, and temporary profile it owns.
 *
 * Run: `node.exe scripts/dev/browser-harness-chrome.mjs browser-playtests/.runtime/browser-harness-cdp.txt`
 */
import { spawn, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'win32') {
  console.error('browser-harness-chrome: invoke this command with Windows node.exe.')
  process.exit(2)
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const artifactRoot = path.join(repositoryRoot, 'browser-playtests')
const endpointFile = path.resolve(repositoryRoot, process.argv[2] ?? '')
const endpointRelative = path.relative(artifactRoot, endpointFile)
if (
  endpointRelative === '' ||
  endpointRelative.startsWith(`..${path.sep}`) ||
  path.isAbsolute(endpointRelative)
) {
  console.error(
    'browser-harness-chrome: endpoint artifact must be inside browser-playtests/.'
  )
  process.exit(2)
}

const roots = [
  process.env.ProgramFiles,
  process.env['ProgramFiles(x86)'],
  process.env.LOCALAPPDATA,
].filter(Boolean)
const chrome = roots
  .map((root) => path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'))
  .find(existsSync)
if (!chrome) {
  console.error(
    'browser-harness-chrome: Chrome was not found in a standard Windows location.'
  )
  process.exit(2)
}

const profile = mkdtempSync(path.join(tmpdir(), 'portfolio-browser-harness-'))
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))
const debugPortTimeoutMs = 10_000
const endpointTimeoutMs = 5_000
const cleanupTimeoutMs = 10_000
const runId = new Date()
  .toISOString()
  .replaceAll('-', '')
  .replaceAll(':', '')
  .replace(/\.[0-9]{3}Z$/u, 'Z')

const debugPortFrom = () => {
  try {
    const [line] = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split(
      /\r?\n/u
    )
    const port = Number(line)
    return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : null
  } catch {
    return null
  }
}

const awaitDebugPort = async (deadline = Date.now() + debugPortTimeoutMs) => {
  const port = debugPortFrom()
  if (port !== null) return port
  if (Date.now() >= deadline) {
    throw new Error(`debug port was not ready within ${debugPortTimeoutMs}ms`)
  }
  await delay(100)
  return awaitDebugPort(deadline)
}

const awaitEndpoint = async (endpoint, deadline = Date.now() + endpointTimeoutMs) => {
  const ready = await fetch(`${endpoint}/json/version`, {
    signal: AbortSignal.timeout(1_000),
  })
    .then((response) => response.ok)
    .catch(() => false)
  if (ready) return
  if (Date.now() >= deadline) {
    throw new Error(`CDP endpoint was not ready within ${endpointTimeoutMs}ms`)
  }
  await delay(100)
  return awaitEndpoint(endpoint, deadline)
}

const terminateOwnedTree = (browser) => {
  if (browser?.exitCode !== null || browser?.pid === undefined) return
  spawnSync('taskkill.exe', ['/PID', String(browser.pid), '/T', '/F'], {
    stdio: 'ignore',
    timeout: cleanupTimeoutMs,
    windowsHide: true,
  })
}

let browser = null
let stopping = false

const cleanup = async (exitCode, reason) => {
  if (stopping) return
  stopping = true
  terminateOwnedTree(browser)
  await delay(250)
  try {
    unlinkSync(endpointFile)
  } catch {
    // An interrupted pre-ready launch has no endpoint artifact.
  }
  try {
    rmSync(profile, {
      recursive: true,
      force: true,
      maxRetries: 20,
      retryDelay: 100,
    })
  } catch (error) {
    console.warn(`browser-harness-chrome: profile cleanup failed: ${error.message}`)
  }
  console.log(`browser-harness-chrome: stopped (${reason}).`)
  process.exit(exitCode)
}

try {
  browser = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true }
  )
  browser.once('error', (error) => {
    void cleanup(1, `launch error: ${error.message}`)
  })
  browser.once('exit', (code, signal) => {
    if (!stopping) {
      void cleanup(1, `unexpected browser exit ${code ?? 'none'}/${signal ?? 'none'}`)
    }
  })
  const port = await awaitDebugPort()
  const endpoint = `http://127.0.0.1:${port}`
  await awaitEndpoint(endpoint)
  mkdirSync(path.dirname(endpointFile), { recursive: true })
  writeFileSync(endpointFile, `${endpoint}\n${runId}\n`, 'utf8')
  console.log(`browser-harness-chrome: ready ${endpoint} ${runId}`)
  console.log('browser-harness-chrome: enter stop to close the owned browser.')

  process.stdin.setEncoding('utf8')
  process.stdin.resume()
  process.stdin.on('data', (chunk) => {
    if (chunk.split(/\r?\n/u).some((line) => line.trim() === 'stop')) {
      void cleanup(0, 'requested')
    }
  })
  process.once('SIGINT', () => void cleanup(0, 'SIGINT'))
  process.once('SIGTERM', () => void cleanup(0, 'SIGTERM'))
} catch (error) {
  await cleanup(1, error instanceof Error ? error.message : String(error))
}
