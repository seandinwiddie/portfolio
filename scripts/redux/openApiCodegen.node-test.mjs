import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  collectOpenApiCodegenFindings,
  collectOpenApiCodegenSmells,
} from './openApiCodegen.mjs'
import { createProjectContext } from './projectContext.mjs'

const emptyApi = [
  "import { createApi as assembleApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';",
  'export const sharedApi = assembleApi({',
  "  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),",
  '  endpoints: () => ({}),',
  '});',
].join('\n')

const injectedOutput = [
  "import { sharedApi as api } from './emptyApi';",
  'export const generatedApi = api.injectEndpoints({',
  "  endpoints: (builder) => ({ getPet: builder.query({ query: () => 'pet' }) }),",
  '});',
].join('\n')

const configSource = (extra = '') =>
  [
    "import type { ConfigFile } from '@rtk-query/codegen-openapi';",
    'const config: ConfigFile = {',
    "  schemaFile: './openapi.json',",
    "  apiFile: './src/emptyApi.ts',",
    "  apiImport: 'sharedApi',",
    "  outputFile: './src/generatedApi.ts',",
    extra,
    '};',
    'export default config;',
  ]
    .filter(Boolean)
    .join('\n')

const createProject = (t, files, codegen = true) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-openapi-codegen-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  const write = (relative, source) => {
    const filePath = path.join(projectRoot, relative)
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, source)
  }
  write(
    'package.json',
    JSON.stringify({
      name: 'fixture',
      devDependencies: codegen ? { '@rtk-query/codegen-openapi': '2.2.0' } : {},
    })
  )
  Object.entries(files).forEach(([relative, source]) => write(relative, source))
  return createProjectContext(projectRoot)
}

test('skips projects without OpenAPI codegen', (t) => {
  const context = createProject(t, { 'src/index.ts': 'export const value = 1;' }, false)
  assert.deepEqual(collectOpenApiCodegenFindings(context), [])
  assert.deepEqual(collectOpenApiCodegenSmells(context), [])
})

test('ignores nested manifests and checker fixtures that describe OpenAPI config', (t) => {
  const context = createProject(
    t,
    {
      'scripts/openApiCodegen.node-test.mjs':
        "export default { apiFile: './emptyApi.ts' };",
      'archive/package.json': JSON.stringify({
        devDependencies: { '@rtk-query/codegen-openapi': '2.2.0' },
      }),
      'archive/openapi-config.ts': configSource(),
    },
    false
  )
  assert.deepEqual(collectOpenApiCodegenFindings(context), [])
  assert.deepEqual(collectOpenApiCodegenSmells(context), [])
})

test('accepts filtered reviewed generation into one empty shared API root', (t) => {
  const context = createProject(t, {
    'openapi-config.ts': configSource(
      [
        "  filterEndpoints: ['getPet'],",
        "  endpointOverrides: [{ pattern: 'getPet', type: 'query' }],",
      ].join('\n')
    ),
    'src/emptyApi.ts': emptyApi,
    'src/generatedApi.ts': injectedOutput,
  })
  assert.deepEqual(collectOpenApiCodegenFindings(context), [])
  assert.deepEqual(collectOpenApiCodegenSmells(context), [])
})

test('blocks a codegen apiFile that owns nonempty endpoints', (t) => {
  const context = createProject(t, {
    'openapi-config.ts': configSource(
      [
        "  filterEndpoints: ['getPet'],",
        "  endpointOverrides: [{ pattern: 'getPet', type: 'query' }],",
      ].join('\n')
    ),
    'src/emptyApi.ts': emptyApi.replace(
      'endpoints: () => ({})',
      "endpoints: (builder) => ({ getPet: builder.query({ query: () => 'pet' }) })"
    ),
    'src/generatedApi.ts': injectedOutput,
  })
  assert.match(
    collectOpenApiCodegenFindings(context).join('\n'),
    /shared createApi root with an empty endpoints factory/
  )
})

test('blocks generated output that creates another API root', (t) => {
  const context = createProject(t, {
    'openapi-config.ts': configSource(
      [
        "  filterEndpoints: ['getPet'],",
        "  endpointOverrides: [{ pattern: 'getPet', type: 'query' }],",
      ].join('\n')
    ),
    'src/emptyApi.ts': emptyApi,
    'src/generatedApi.ts': [
      "import { createApi } from '@reduxjs/toolkit/query/react';",
      'export const generatedApi = createApi({ endpoints: () => ({}) });',
    ].join('\n'),
  })
  assert.match(
    collectOpenApiCodegenFindings(context).join('\n'),
    /creates a new createApi root instead of injecting endpoints/
  )
})

test('returns broad generation and missing overrides as skill smells', (t) => {
  const context = createProject(t, {
    'openapi-config.ts': configSource(),
    'src/emptyApi.ts': emptyApi,
    'src/generatedApi.ts': injectedOutput,
  })
  assert.deepEqual(collectOpenApiCodegenFindings(context), [])
  const notices = collectOpenApiCodegenSmells(context)
  assert.match(notices.map(({ guidance }) => guidance).join('\n'), /no filterEndpoints/)
  assert.match(
    notices.map(({ guidance }) => guidance).join('\n'),
    /endpointOverrides are absent/
  )
  notices.forEach((notice) => {
    assert.equal(notice.level, 'SMELL')
    assert.equal(notice.skill, 'manage-server-data/generate-rtk-query-from-openapi')
    assert.equal(
      notice.localReference.endsWith(
        '/manage-server-data-generate-rtk-query-from-openapi/references/codegen-overrides.md'
      ),
      true
    )
    assert.match(
      notice.guidance,
      /Read manage-server-data\/generate-rtk-query-from-openapi/
    )
  })
})

test('keeps dynamic config nonblocking and routes it to skill review', (t) => {
  const context = createProject(t, {
    'openapi-config.ts': [
      "import type { ConfigFile } from '@rtk-query/codegen-openapi';",
      'declare const loadConfig: () => ConfigFile;',
      'export default loadConfig();',
    ].join('\n'),
  })
  assert.deepEqual(collectOpenApiCodegenFindings(context), [])
  assert.match(
    collectOpenApiCodegenSmells(context)
      .map(({ guidance }) => guidance)
      .join('\n'),
    /dynamic or unresolvable/
  )
})
