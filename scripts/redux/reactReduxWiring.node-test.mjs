import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createProjectContext } from './projectContext.mjs'
import { collectReactReduxWiringFindings } from './reactReduxWiring.mjs'

const storeSource = [
  "import { configureStore } from '@reduxjs/toolkit';",
  'export const makeStore = () => configureStore({ reducer: (state = {}) => state });',
  'export const store = makeStore();',
  'export type AppState = ReturnType<typeof store.getState>;',
  'export type AppDispatch = typeof store.dispatch;',
  'export type AppStore = ReturnType<typeof makeStore>;',
].join('\n')

const hooksSource = [
  "import { useDispatch, useSelector, useStore } from 'react-redux';",
  "import type { AppDispatch, AppState, AppStore } from '../store';",
  'export const useAppDispatch = useDispatch.withTypes<AppDispatch>();',
  'export const useAppSelector = useSelector.withTypes<AppState>();',
  'export const useAppStore = useStore.withTypes<AppStore>();',
].join('\n')

const providerSource = [
  "import { Provider as AppProvider } from 'react-redux';",
  "import { store as rootStore } from '../src/store';",
  'export const App = () => <AppProvider store={rootStore}><main /></AppProvider>;',
].join('\n')

const createProject = (t, changes = {}) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-react-redux-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  const files = {
    'package.json': JSON.stringify({ name: 'fixture' }),
    'src/store.ts': storeSource,
    'src/app/hooks.ts': hooksSource,
    'app/main.tsx': providerSource,
    ...changes,
  }
  Object.entries(files)
    .filter(([, source]) => source !== null)
    .forEach(([relative, source]) => {
      const filePath = path.join(projectRoot, relative)
      mkdirSync(path.dirname(filePath), { recursive: true })
      writeFileSync(filePath, source)
    })
  return createProjectContext(projectRoot)
}

test('accepts one typed hook module and an aliased Provider receiving the root store', (t) => {
  assert.deepEqual(collectReactReduxWiringFindings(createProject(t)), [])
})

test('accepts a stable provider-local store made by the root store factory', (t) => {
  const context = createProject(t, {
    'app/main.tsx': [
      "import { useState } from 'react';",
      "import * as Redux from 'react-redux';",
      "import { makeStore } from '../src/store';",
      'export const App = () => {',
      '  const [appStore] = useState(makeStore);',
      '  return <Redux.Provider store={appStore}><main /></Redux.Provider>;',
      '};',
    ].join('\n'),
  })
  assert.deepEqual(collectReactReduxWiringFindings(context), [])
})

test('rejects hook consumption when no production Provider is discoverable', (t) => {
  const findings = collectReactReduxWiringFindings(
    createProject(t, {
      'app/main.tsx': null,
    })
  ).join('\n')
  assert.match(findings, /hooks require a discoverable react-redux Provider/)
})

test('rejects a Provider whose store prop is not derived from the root store', (t) => {
  const findings = collectReactReduxWiringFindings(
    createProject(t, {
      'app/main.tsx': [
        "import { Provider } from 'react-redux';",
        'const unrelatedStore = { dispatch() {}, getState() { return {} } };',
        'export const App = () => <Provider store={unrelatedStore}><main /></Provider>;',
      ].join('\n'),
    })
  ).join('\n')
  assert.match(findings, /Provider store prop must receive a root configureStore value/)
})

test('rejects raw hook factories split across modules', (t) => {
  const findings = collectReactReduxWiringFindings(
    createProject(t, {
      'src/features/Widget.tsx': [
        "import { useSelector } from 'react-redux';",
        'export const Widget = () => useSelector((state) => state.value);',
      ].join('\n'),
    })
  ).join('\n')
  assert.match(findings, /must be centralized in exactly one module; found 2/)
  assert.match(findings, /raw react-redux hook useSelector is called directly/)
})

test('rejects missing exports, wrong role types, and direct raw calls', (t) => {
  const context = createProject(t, {
    'src/app/hooks.ts': [
      "import { useDispatch, useSelector, useStore } from 'react-redux';",
      'export const useAppDispatch = useDispatch.withTypes<AppDispatch>();',
      'export const useAppSelector = useSelector.withTypes<UnknownState>();',
      'const useAppStore = useStore.withTypes<AppStore>();',
      'export const dispatchNow = () => useDispatch();',
    ].join('\n'),
  })
  const findings = collectReactReduxWiringFindings(context).join('\n')
  assert.match(
    findings,
    /useSelector\.withTypes must be exported exactly once with AppState or RootState/
  )
  assert.match(
    findings,
    /useStore\.withTypes must be exported exactly once with AppStore/
  )
  assert.match(findings, /raw react-redux hook useDispatch is called directly/)
})
