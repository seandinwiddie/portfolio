import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { collectApiEndpointTagAnalysis } from './apiEndpointTags.mjs'

const projectRoot = path.resolve('virtual-endpoint-app')
const apiFile = path.join(
  projectRoot,
  'src',
  'features',
  'systems',
  'service',
  'serviceApi.ts'
)

const contextFor = (text) => ({
  projectRoot,
  apiFiles: [apiFile],
  sourceFiles: [apiFile],
  roleForFile: () => 'api',
  readText: () => text,
  relativeToProject: (filePath) => path.relative(projectRoot, filePath),
})

const sourceFor = (body) =>
  ["import { createApi as assembleApi } from '@reduxjs/toolkit/query/react';", body].join(
    '\n'
  )

test('checks only RTK endpoint-builder calls and resolves local object spreads', () => {
  const analysis = collectApiEndpointTagAnalysis(
    contextFor(
      sourceFor(`
    const request = { query: () => 'posts' };
    const tagged = { ...request, providesTags: ['Post'] };
    const definition = {
      endpoints: (build) => ({ getPosts: build.query(tagged) }),
    };
    analytics.query({ query: () => 'telemetry' });
    export const api = assembleApi({ ...definition });
  `)
    )
  )
  assert.deepEqual(analysis.findings, [])
  assert.deepEqual(analysis.reviews, [])
})

test('reports a statically resolved builder endpoint without tags', () => {
  const analysis = collectApiEndpointTagAnalysis(
    contextFor(
      sourceFor(`
    export const api = assembleApi({
      endpoints: (builder) => ({
        getPosts: builder.query({ query: () => 'posts' }),
      }),
    });
  `)
    )
  )
  assert.equal(analysis.findings.length, 1)
  assert.deepEqual(analysis.reviews, [])
})

test('routes a dynamic endpoint config to a referenced review', () => {
  const analysis = collectApiEndpointTagAnalysis(
    contextFor(
      sourceFor(`
    const dynamicConfig = loadEndpointConfig();
    export const api = assembleApi({
      endpoints: (builder) => ({ getPosts: builder.query(dynamicConfig) }),
    });
  `)
    )
  )
  assert.deepEqual(analysis.findings, [])
  assert.equal(analysis.reviews.length, 1)
  assert.equal(analysis.reviews[0].level, 'REVIEW')
  assert.match(
    analysis.reviews[0].skillFile,
    /manage-server-data-adopt-rtk-query\/SKILL\.md$/
  )
  assert.match(analysis.reviews[0].reference, /^https:\/\//)
  assert.match(analysis.reviews[0].guidance, /not statically resolvable/)
})

test('ignores same-named query calls that do not use the RTK builder parameter', () => {
  const analysis = collectApiEndpointTagAnalysis(
    contextFor(
      sourceFor(`
    analytics.query({ query: () => 'telemetry' });
    local.injectEndpoints({
      endpoints: (builder) => ({ fake: builder.query({ query: () => 'fake' }) }),
    });
    export const api = assembleApi({
      endpoints: (builder) => {
        [analytics].map((builder) => builder.query({ query: () => 'local' }));
        return {};
      },
    });
  `)
    )
  )
  assert.deepEqual(analysis.findings, [])
  assert.deepEqual(analysis.reviews, [])
})

test('checks endpoint builders injected through an imported API root', () => {
  const injectedFile = path.join(
    projectRoot,
    'src',
    'features',
    'systems',
    'service',
    'postsApi.ts'
  )
  const sources = new Map([
    [apiFile, sourceFor('export const api = assembleApi({ endpoints: () => ({}) });')],
    [
      injectedFile,
      [
        "import { api } from './serviceApi';",
        'export const postsApi = api.injectEndpoints({',
        "  endpoints: (builder) => ({ getPosts: builder.query({ query: () => 'posts' }) }),",
        '});',
      ].join('\n'),
    ],
  ])
  const analysis = collectApiEndpointTagAnalysis({
    projectRoot,
    apiFiles: [apiFile],
    sourceFiles: [...sources.keys()],
    roleForFile: () => 'api',
    readText: (filePath) => sources.get(filePath),
    relativeToProject: (filePath) => path.relative(projectRoot, filePath),
  })
  assert.equal(analysis.findings.length, 1)
  assert.deepEqual(analysis.reviews, [])
})
