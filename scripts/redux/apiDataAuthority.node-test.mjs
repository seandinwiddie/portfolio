import assert from 'node:assert/strict'
import test from 'node:test'

import { collectApiDataAuthorityFindings } from './apiDataAuthority.mjs'

const projectRoot = '/project'
const apiRoot = `${projectRoot}/src/features/systems/platform/foundation/api/apiApi.ts`

const contextFor = (sources, apiFiles = [apiRoot]) => ({
  projectRoot,
  apiFiles,
  sourceFiles: Object.keys(sources)
    .filter((relative) => /\.(?:[cm]?[jt]sx?)$/u.test(relative))
    .map((relative) => `${projectRoot}/${relative}`),
  sourceJsonFiles: Object.keys(sources)
    .filter((relative) => relative.endsWith('.json'))
    .map((relative) => `${projectRoot}/${relative}`),
  readText: (filePath) => sources[filePath.replace(`${projectRoot}/`, '')],
  relativeToProject: (filePath) => filePath.replace(`${projectRoot}/`, ''),
})

test('allows type-only data contracts and TypeScript presentation styles', () => {
  const context = contextFor({
    'src/features/systems/portfolio/profile/content/contentSelectors.ts': [
      "import type { AppData } from '../../../../../data/ambientScene'",
      "import { AYU_COLORS } from '../../../../../styles/themes/ayuThemePalettes'",
      'export const selectContract = (): typeof AppData | undefined => AYU_COLORS.missing',
    ].join('\n'),
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})

test('blocks runtime values even when a local authority file is named as a contract', () => {
  const context = contextFor({
    'src/features/systems/portfolio/profile/content/contentSelectors.ts': [
      "import { initialStateSchema } from '../../../../../data/schemas'",
      'export const selectContract = () => initialStateSchema',
    ].join('\n'),
  })

  assert.match(
    collectApiDataAuthorityFindings(context).join('\n'),
    /API-DATA-001.*src\/data\/schemas/u
  )
})

test('blocks runtime imports and re-exports from local data or content authority', () => {
  const context = contextFor({
    'src/features/systems/shell/frame/ambientScene/ambientSceneThunks.ts': [
      "import { type SceneWorld, ORBITAL_WORLD } from '../../../../../data/ambientScene'",
      "export { aboutCopy } from '@/content/about'",
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context).join('\n')

  assert.match(findings, /API-DATA-001.*src\/data\/ambientScene/u)
  assert.match(findings, /API-DATA-001.*src\/content\/about/u)
})

test('blocks static and dynamic local JSON even inside the system API boundary', () => {
  const context = contextFor({
    'src/features/systems/platform/foundation/api/apiApi.ts': [
      "import localState from '../../../../../data/initialState.json'",
      "export const loadMore = () => import('../../../../../styles/themes/palette.json')",
      'export const state = localState',
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-002')).length, 2)
  assert.match(findings.join('\n'), /src\/data\/initialState\.json/u)
  assert.match(findings.join('\n'), /src\/styles\/themes\/palette\.json/u)
})

test('blocks unimported production JSON under src while excluding test JSON', () => {
  const context = contextFor({
    'src/data/initialState.json': '{"local":true}',
    'src/styles/themes/palette.json': '{"palette":true}',
    'src/data/__tests__/fixture.json': '{"fixture":true}',
    'src/data/ambientScene.test.json': '{"fixture":true}',
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-002')).length, 2)
  assert.match(findings.join('\n'), /src\/data\/initialState\.json:1 stores local JSON/u)
  assert.match(
    findings.join('\n'),
    /src\/styles\/themes\/palette\.json:1 stores local JSON/u
  )
  assert.doesNotMatch(findings.join('\n'), /fixture\.json|ambientScene\.test\.json/u)
})

test('blocks fetch and axios outside API roles while allowing the system API adapter', () => {
  const context = contextFor({
    'src/views/status/statusView.tsx': "export const load = () => fetch('/status')",
    'src/features/systems/platform/foundation/note/noteThunks.ts': [
      "import client from 'axios'",
      "export const load = () => client.get('/note')",
    ].join('\n'),
    'src/features/systems/platform/foundation/api/apiAdapters.ts': [
      "import client from 'axios'",
      "export const load = () => Promise.all([fetch('/data'), client.get('/data')])",
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-003')).length, 2)
  assert.match(findings.join('\n'), /statusView\.tsx:1 calls fetch/u)
  assert.match(findings.join('\n'), /noteThunks\.ts:1 imports axios/u)
  assert.doesNotMatch(findings.join('\n'), /apiAdapters/u)
})

test('does not mistake a locally injected fetch capability for the global effect', () => {
  const context = contextFor({
    'src/features/systems/platform/foundation/note/noteThunks.ts':
      'export const load = (fetch: (key: string) => string) => fetch("note")',
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})

test('requires the createApi root to live inside the system API boundary', () => {
  const outsideApi = `${projectRoot}/src/features/systems/platform/foundation/note/noteApi.ts`
  const context = contextFor(
    {
      'src/features/systems/platform/foundation/note/noteApi.ts':
        'export const noteApi = {}',
    },
    [outsideApi]
  )

  assert.match(
    collectApiDataAuthorityFindings(context).join('\n'),
    /API-DATA-004.*requires an RTK Query createApi root/u
  )
})

test('keeps tests outside runtime authority enforcement', () => {
  const context = contextFor({
    'src/views/status/statusView.test.ts': [
      "import payload from '../../../data/initialState.json'",
      "export const load = () => fetch('/fixture')",
    ].join('\n'),
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})
