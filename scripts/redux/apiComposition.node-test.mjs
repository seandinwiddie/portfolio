import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {
  collectApiCompositionFindings,
  collectApiCompositionSmells,
} from './apiComposition.mjs'
import { selectEndpointApiFiles } from './apiEndpointTags.mjs'

const projectRoot = path.resolve('virtual-app')
const root = path.join(projectRoot, 'src')
const apiRoot = path.join(root, 'features', 'api', 'apiApi.ts')
const endpointApi = path.join(root, 'features', 'api', 'endpoints', 'mood', 'moodApi.ts')
const slice = path.join(root, 'features', 'mood', 'moodSlice.ts')
const rtkImports =
  "import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';"

/**
 * Creates a minimal RTK Query composition checker context.
 * User Story: As a checker maintainer, I need portable API fixtures so split
 * endpoint ownership is tested independently from production source files.
 * @signature const contextFor = (apiRootSource) => object
 */
const contextFor = (
  apiRootSource,
  endpointSource = 'export const moodApi = api.injectEndpoints({ endpoints: (builder) => ({ getMood: builder.query({}) }) });'
) => {
  const sources = new Map([
    [apiRoot, [rtkImports, apiRootSource].join('\n')],
    [endpointApi, endpointSource],
    [slice, 'export const moodSlice = createSlice({});'],
  ])
  return {
    projectRoot,
    srcRoot: root,
    sourceFiles: [...sources.keys()],
    roleForFile: (filePath) => (filePath.endsWith('Api.ts') ? 'api' : 'slice'),
    readText: (filePath) => sources.get(filePath),
    relativeToProject: (filePath) => path.relative(projectRoot, filePath),
  }
}

const contextForRoots = (rootSources) => {
  const sources = new Map(
    rootSources.map((source, index) => [
      path.join(root, 'features', `service${index}`, `service${index}Api.ts`),
      source,
    ])
  )
  return {
    projectRoot,
    srcRoot: root,
    sourceFiles: [...sources.keys()],
    roleForFile: () => 'api',
    readText: (filePath) => sources.get(filePath),
    relativeToProject: (filePath) => path.relative(projectRoot, filePath),
  }
}

test('rejects split endpoint modules composed directly inside createApi', () => {
  const context = contextFor(
    'export const api = createApi({ endpoints: buildNpcEndpoints });'
  )
  assert.match(collectApiCompositionFindings(context)[0], /empty endpoints factory/)
})

test('accepts one empty base API extended by a feature API role file', () => {
  const context = contextFor('export const api = createApi({ endpoints: () => ({}) });')
  assert.deepEqual(collectApiCompositionFindings(context), [])
})

test('rejects endpoint definitions that do not inject into the root API', () => {
  const context = contextFor(
    'export const api = createApi({ endpoints: () => ({}) });',
    'export const buildNpcEndpoints = (builder) => ({ getMood: builder.query({}) });'
  )
  assert.match(
    collectApiCompositionFindings(context)[0],
    /must extend the app createApi root through injectEndpoints/
  )
})

test('endpoint tag analysis includes every API role file', () => {
  const context = contextFor('export const api = createApi({ endpoints: () => ({}) });')
  assert.deepEqual(selectEndpointApiFiles(context), [apiRoot, endpointApi])
})

test('duplicate createApi roots are rejected only for the same literal base URL', () => {
  const sourceFor = (baseUrl) =>
    [
      rtkImports,
      `export const api = createApi({ baseQuery: fetchBaseQuery({ baseUrl: '${baseUrl}' }), endpoints: () => ({}) });`,
    ].join('\n')
  const duplicate = contextForRoots([sourceFor('/api'), sourceFor('/api')])
  assert.equal(collectApiCompositionFindings(duplicate).length, 2)
  assert.match(
    collectApiCompositionFindings(duplicate)[0],
    /more than one createApi root targets base URL \/api/
  )
  const distinct = contextForRoots([sourceFor('/api'), sourceFor('/admin')])
  assert.deepEqual(collectApiCompositionFindings(distinct), [])
})

test('unresolved multi-root base URLs emit a smell instead of a hard failure', () => {
  const context = contextForRoots([
    [
      rtkImports,
      'export const api = createApi({ baseQuery, endpoints: () => ({}) });',
    ].join('\n'),
    [
      rtkImports,
      "export const adminApi = createApi({ baseQuery: fetchBaseQuery({ baseUrl: '/admin' }), endpoints: () => ({}) });",
    ].join('\n'),
  ])
  assert.deepEqual(collectApiCompositionFindings(context), [])
  assert.match(
    collectApiCompositionSmells(context).join('\n'),
    /non-literal or unresolved baseUrl/
  )
})

test('recognizes aliased createApi imports and ignores local same-name calls', () => {
  const context = contextForRoots([
    [
      "import { createApi as assembleApi } from '@reduxjs/toolkit/query/react';",
      'export const api = assembleApi({ endpoints: () => ({}) });',
    ].join('\n'),
    [
      '// createApi({ endpoints: () => ({}) })',
      'const createApi = (config) => config;',
      'export const localApi = createApi({ endpoints: () => ({}) });',
    ].join('\n'),
  ])
  assert.deepEqual(collectApiCompositionFindings(context), [])
  assert.deepEqual(collectApiCompositionSmells(context), [])
})
