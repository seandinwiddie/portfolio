import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { collectApiStoreWiringFindings } from './apiStoreWiring.mjs'
import { createProjectContext } from './projectContext.mjs'

const createProject = (t, storeSource) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-api-store-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  const apiDirectory = path.join(projectRoot, 'src', 'features', 'systems', 'service')
  mkdirSync(apiDirectory, { recursive: true })
  writeFileSync(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({ name: 'fixture' })
  )
  writeFileSync(
    path.join(apiDirectory, 'serviceApi.ts'),
    [
      "import { createApi as assembleApi } from '@reduxjs/toolkit/query/react';",
      "export const serviceApi = assembleApi({ reducerPath: 'service', endpoints: () => ({}) });",
    ].join('\n')
  )
  writeFileSync(path.join(projectRoot, 'src', 'store.ts'), storeSource)
  return createProjectContext(projectRoot)
}

test('createApi reducer and middleware wired in root configureStore pass', (t) => {
  const context = createProject(
    t,
    [
      "import { configureStore as assembleStore } from '@reduxjs/toolkit';",
      "import { serviceApi as api } from './features/systems/service/serviceApi';",
      'export const store = assembleStore({',
      '  reducer: { [api.reducerPath]: api.reducer },',
      '  middleware: (defaults) => defaults().concat(api.middleware),',
      '});',
    ].join('\n')
  )
  assert.deepEqual(collectApiStoreWiringFindings(context), [])
})

test('createApi wiring reached through a local root reducer assembly passes', (t) => {
  const context = createProject(
    t,
    [
      "import { combineReducers, configureStore } from '@reduxjs/toolkit';",
      "import { serviceApi } from './features/systems/service/serviceApi';",
      'const rootReducer = combineReducers({ [serviceApi.reducerPath]: serviceApi.reducer });',
      'export const store = configureStore({',
      '  reducer: rootReducer,',
      '  middleware: (defaults) => defaults().concat(serviceApi.middleware),',
      '});',
    ].join('\n')
  )
  assert.deepEqual(collectApiStoreWiringFindings(context), [])
})

test('missing createApi reducer and middleware wiring are both reported', (t) => {
  const context = createProject(
    t,
    [
      "import { configureStore as assembleStore } from '@reduxjs/toolkit';",
      "import { serviceApi } from './features/systems/service/serviceApi';",
      'export const store = assembleStore({ reducer: {}, middleware: (defaults) => defaults() });',
    ].join('\n')
  )
  const findings = collectApiStoreWiringFindings(context).join('\n')
  assert.match(findings, /serviceApi reducer is not wired/)
  assert.match(findings, /serviceApi middleware is not wired/)
})
