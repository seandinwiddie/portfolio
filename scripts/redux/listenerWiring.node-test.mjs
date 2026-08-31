import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { collectListenerWiringFindings } from './listenerWiring.mjs'
import { createProjectContext } from './projectContext.mjs'

const listenerSource = [
  "import { createListenerMiddleware as makeListener } from '@reduxjs/toolkit';",
  "import type { AppDispatch, AppState } from '../store';",
  'export const listenerMiddleware = makeListener();',
  'export const startAppListening =',
  '  listenerMiddleware.startListening.withTypes<AppState, AppDispatch>();',
].join('\n')

const storeSource = [
  "import { configureStore } from '@reduxjs/toolkit';",
  "import { listenerMiddleware as appListener } from './features/listeners';",
  'const logger = () => (next) => (action) => next(action);',
  'const withMiddleware = (defaults) =>',
  '  defaults().prepend(appListener.middleware).concat(logger);',
  'export const store = configureStore({',
  '  reducer: (state = {}) => state,',
  '  middleware: withMiddleware,',
  '});',
  'export type AppState = ReturnType<typeof store.getState>;',
  'export type AppDispatch = typeof store.dispatch;',
].join('\n')

const createProject = (t, changes = {}) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-listener-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  const files = {
    'package.json': JSON.stringify({ name: 'fixture' }),
    'src/store.ts': storeSource,
    'src/features/listeners.ts': listenerSource,
    ...changes,
  }
  Object.entries(files).forEach(([relative, source]) => {
    const filePath = path.join(projectRoot, relative)
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, source)
  })
  return createProjectContext(projectRoot)
}

test('accepts one aliased listener instance prepended through a store helper', (t) => {
  assert.deepEqual(collectListenerWiringFindings(createProject(t)), [])
})

test('accepts one prepend on every conditional middleware path', (t) => {
  const conditionalStore = storeSource.replace(
    'defaults().prepend(appListener.middleware).concat(logger)',
    'enabled ? defaults().prepend(appListener.middleware).concat(logger) : defaults().prepend(appListener.middleware)'
  )
  assert.deepEqual(
    collectListenerWiringFindings(createProject(t, { 'src/store.ts': conditionalStore })),
    []
  )
})

test('rejects concat wiring and a TypedStartListening assertion cast', (t) => {
  const context = createProject(t, {
    'src/store.ts': storeSource.replace(
      'prepend(appListener.middleware)',
      'concat(appListener.middleware)'
    ),
    'src/features/listeners.ts': [
      "import { createListenerMiddleware } from '@reduxjs/toolkit';",
      "import type { TypedStartListening } from '@reduxjs/toolkit';",
      "import type { AppDispatch, AppState } from '../store';",
      'export const listenerMiddleware = createListenerMiddleware();',
      'export const startAppListening = listenerMiddleware.startListening',
      '  as TypedStartListening<AppState, AppDispatch>;',
    ].join('\n'),
  })
  const findings = collectListenerWiringFindings(context).join('\n')
  assert.match(findings, /must use prepend, never concat/)
  assert.match(
    findings,
    /must use listenerMiddleware\.startListening\.withTypes<AppState, AppDispatch>/
  )
})

test('rejects duplicate wiring of the same listener instance', (t) => {
  const context = createProject(t, {
    'src/store.ts': storeSource.replace(
      'defaults().prepend(appListener.middleware).concat(logger)',
      'defaults().prepend(appListener.middleware).prepend(appListener.middleware).concat(logger)'
    ),
  })
  assert.match(
    collectListenerWiringFindings(context).join('\n'),
    /must be wired exactly once.*found 2/
  )
})

test('rejects a conditional path that omits the listener middleware', (t) => {
  const conditionalStore = storeSource.replace(
    'defaults().prepend(appListener.middleware).concat(logger)',
    'enabled ? defaults().prepend(appListener.middleware) : defaults()'
  )
  assert.match(
    collectListenerWiringFindings(
      createProject(t, { 'src/store.ts': conditionalStore })
    ).join('\n'),
    /must be wired exactly once.*found 1 or 0/
  )
})

test('does not count a different listener instance as root wiring', (t) => {
  const context = createProject(t, {
    'src/features/listeners.ts': [
      "import { createListenerMiddleware } from '@reduxjs/toolkit';",
      "import type { AppDispatch, AppState } from '../store';",
      'export const listenerMiddleware = createListenerMiddleware();',
      'export const otherListener = createListenerMiddleware();',
      'export const startAppListening = listenerMiddleware.startListening.withTypes<AppState, AppDispatch>();',
      'export const startOtherListening = otherListener.startListening.withTypes<AppState, AppDispatch>();',
    ].join('\n'),
  })
  const findings = collectListenerWiringFindings(context).join('\n')
  assert.match(findings, /otherListener must be wired exactly once.*found 0/)
  assert.doesNotMatch(findings, /listenerMiddleware must be wired exactly once/)
})

test('rejects an instance without an exported typed startListening boundary', (t) => {
  const context = createProject(t, {
    'src/features/listeners.ts': [
      "import { createListenerMiddleware } from '@reduxjs/toolkit';",
      'export const listenerMiddleware = createListenerMiddleware();',
    ].join('\n'),
  })
  assert.match(
    collectListenerWiringFindings(context).join('\n'),
    /must export startListening\.withTypes<AppState, AppDispatch>/
  )
})

test('ignores a same-named factory imported from first-party code', (t) => {
  const context = createProject(t, {
    'src/features/listeners.ts': [
      "import { createListenerMiddleware } from './notToolkit';",
      'export const listenerMiddleware = createListenerMiddleware();',
    ].join('\n'),
    'src/features/notToolkit.ts':
      'export const createListenerMiddleware = () => ({ middleware: {} });',
  })
  assert.deepEqual(collectListenerWiringFindings(context), [])
})

test('ignores variable declarations without an initializer', (t) => {
  const context = createProject(t, {
    'src/features/listeners.ts': [listenerSource, 'let deferredPersistence;'].join('\n'),
  })
  assert.deepEqual(collectListenerWiringFindings(context), [])
})
