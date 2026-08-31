import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createProjectContext } from './projectContext.mjs'

const writeFixture = (root, relative, source) => {
  const filePath = path.join(root, relative)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, source)
}

test('scans only the Expo app source trees and root manifest', (t) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-redux-context-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  writeFixture(projectRoot, 'package.json', JSON.stringify({ name: 'fixture' }))
  writeFixture(
    projectRoot,
    'src/store.ts',
    [
      "import { configureStore as assembleStore } from '@reduxjs/toolkit';",
      'export const store = assembleStore({ reducer: {} });',
    ].join('\n')
  )
  writeFixture(
    projectRoot,
    'app/index.tsx',
    'export default function Index() { return null; }'
  )
  writeFixture(
    projectRoot,
    'src/features/systems/coverage/coverageSelectors.native.ts',
    'export const selectCoverage = (state: AppState) => state.coverage;'
  )
  writeFixture(
    projectRoot,
    'src/features/systems/service/serviceApi.ts',
    [
      "import { createApi as assembleApi } from '@reduxjs/toolkit/query/react';",
      'export const serviceApi = assembleApi({ endpoints: () => ({}) });',
    ].join('\n')
  )
  writeFixture(
    projectRoot,
    'src/features/systems/fake/fakeAdapters.ts',
    [
      '// configureStore(); createApi();',
      'const configureStore = () => null;',
      'const createApi = () => null;',
      'configureStore(); createApi();',
    ].join('\n')
  )
  writeFixture(
    projectRoot,
    'src/features/systems/fake/shadowAdapters.ts',
    [
      "import { configureStore as assembleStore } from '@reduxjs/toolkit';",
      "import { createApi as assembleApi } from '@reduxjs/toolkit/query/react';",
      'export const shadowed = (assembleStore, assembleApi) => {',
      '  assembleStore(); assembleApi();',
      '};',
    ].join('\n')
  )
  writeFixture(
    projectRoot,
    'coverage/src/generatedApi.ts',
    [
      "import { createApi } from '@reduxjs/toolkit/query/react';",
      'export const generatedApi = createApi({});',
    ].join('\n')
  )
  writeFixture(
    projectRoot,
    'archive/src/rogueApi.ts',
    'export const rogue = createApi({});'
  )
  writeFixture(projectRoot, 'archive/package.json', JSON.stringify({ name: 'archive' }))
  writeFixture(projectRoot, 'src/data/unreferenced.json', '{"local":true}')
  writeFixture(projectRoot, 'src/data/__tests__/fixture.json', '{"fixture":true}')
  writeFixture(projectRoot, 'src/data/local.test.json', '{"fixture":true}')
  writeFixture(projectRoot, 'app/data/route.json', '{"route":true}')

  const context = createProjectContext(projectRoot)
  assert.deepEqual(context.sourceFiles.map(context.relativeToProject), [
    'app/index.tsx',
    'src/features/systems/coverage/coverageSelectors.native.ts',
    'src/features/systems/fake/fakeAdapters.ts',
    'src/features/systems/fake/shadowAdapters.ts',
    'src/features/systems/service/serviceApi.ts',
    'src/store.ts',
  ])
  assert.equal(context.manifestFile, path.join(projectRoot, 'package.json'))
  assert.deepEqual(context.sourceJsonFiles, [
    path.join(projectRoot, 'src', 'data', 'unreferenced.json'),
  ])
  assert.deepEqual(context.apiFiles, [
    path.join(projectRoot, 'src', 'features', 'systems', 'service', 'serviceApi.ts'),
  ])
  assert.deepEqual(context.storeFiles, [path.join(projectRoot, 'src', 'store.ts')])
  assert.deepEqual(context.configureStoreFiles, context.storeFiles)
})
