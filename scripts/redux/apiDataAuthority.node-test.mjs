import assert from 'node:assert/strict'
import test from 'node:test'

import { collectApiDataAuthorityFindings } from './apiDataAuthority.mjs'

const projectRoot = '/project'
const apiRoot = `${projectRoot}/src/features/systems/substrate/kernel/api/apiApi.ts`

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
    'src/features/systems/registry/dossier/records/recordsSelectors.ts': [
      "import type { AppData } from '../../../../../data/ambientScene'",
      "import { AYU_COLORS } from '../../../../../styles/themes/ayuThemePalettes'",
      'export const selectContract = (): typeof AppData | undefined => AYU_COLORS.missing',
    ].join('\n'),
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})

test('blocks runtime values even when a local authority file is named as a contract', () => {
  const context = contextFor({
    'src/features/systems/registry/dossier/records/recordsSelectors.ts': [
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
    'src/features/systems/bridge/chassis/ambientScene/ambientSceneThunks.ts': [
      "import { type SceneWorld, ORBITAL_WORLD } from '../../../../../data/ambientScene'",
      "export { dossierCopy } from '@/content/dossier'",
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context).join('\n')

  assert.match(findings, /API-DATA-001.*src\/data\/ambientScene/u)
  assert.match(findings, /API-DATA-001.*src\/content\/dossier/u)
})

test('blocks static and dynamic local JSON even inside the system API boundary', () => {
  const context = contextFor({
    'src/features/systems/substrate/kernel/api/apiApi.ts': [
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
    'src/views/telemetry/telemetryView.tsx': "export const load = () => fetch('/status')",
    'src/features/systems/substrate/kernel/note/noteThunks.ts': [
      "import client from 'axios'",
      "export const load = () => client.get('/note')",
    ].join('\n'),
    'src/features/systems/substrate/kernel/api/apiAdapters.ts': [
      "import client from 'axios'",
      "export const load = () => Promise.all([fetch('/data'), client.get('/data')])",
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-003')).length, 2)
  assert.match(findings.join('\n'), /telemetryView\.tsx:1 calls fetch/u)
  assert.match(findings.join('\n'), /noteThunks\.ts:1 imports axios/u)
  assert.doesNotMatch(findings.join('\n'), /apiAdapters/u)
})

test('does not mistake a locally injected fetch capability for the global effect', () => {
  const context = contextFor({
    'src/features/systems/substrate/kernel/note/noteThunks.ts':
      'export const load = (fetch: (key: string) => string) => fetch("note")',
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})

test('blocks authored JSX copy in every production view', () => {
  const context = contextFor({
    'src/views/registry/telemetry/newPanel/newPanelView.tsx':
      'export const Ingress = () => <h1>Launch the next mission</h1>',
  })

  assert.match(
    collectApiDataAuthorityFindings(context).join('\n'),
    /API-DATA-006.*newPanelView\.tsx:1.*authored presentation copy/u
  )
})

test('blocks authored accessibility, title, legend, and placeholder attributes in every view', () => {
  const context = contextFor({
    'src/views/registry/dossier/newPanel/newPanelView.tsx': [
      'export const Panel = () => (',
      '  <section aria-label="Mission controls" title="Live dossier">',
      '    <input placeholder="Search records" accessibilityHint="Enter a query" />',
      '    <meter legend="Signal strength" />',
      '  </section>',
      ')',
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-006')).length, 5)
})

test('blocks authored string expressions in JSX while allowing structural tokens', () => {
  const context = contextFor({
    'src/views/registry/dossier/newPanel/newPanelView.tsx': [
      'export const Panel = ({ label }) => (',
      '  <section className="system-panel" role="region" aria-live="polite">',
      "    {'Local authored copy'}",
      '    <span>{label}</span>',
      '  </section>',
      ')',
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-006')).length, 1)
  assert.match(findings[0], /newPanelView\.tsx:3/u)
})

test('governs Observatory presentation copy and its RTK Query routes', () => {
  const apiSource = [
    "import { createApi } from '@reduxjs/toolkit/query/react'",
    "const routes = ['/data', '/github', '/github/commits', '/observatory', '/presence', '/status']",
    'export const api = createApi({ reducerPath: routes.join() })',
  ].join('\n')
  const context = contextFor({
    'src/features/systems/substrate/kernel/api/apiApi.ts': apiSource,
    'src/views/registry/observatory/signalArray/signalArrayView.tsx':
      'export const Observatory = () => <h2>Local impact dashboard copy</h2>',
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.match(findings.join('\n'), /API-DATA-006.*signalArrayView\.tsx/u)
  assert.doesNotMatch(findings.join('\n'), /API-DATA-007/u)
})

test('requires every public server-data route at the RTK Query boundary', () => {
  const context = contextFor({
    'src/features/systems/substrate/kernel/api/apiApi.ts': [
      "import { createApi } from '@reduxjs/toolkit/query/react'",
      "const routes = ['/data', '/github', '/github/commits', '/status']",
      'export const api = createApi({ reducerPath: routes.join() })',
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context).join('\n')

  assert.match(findings, /API-DATA-007.*\/observatory/u)
  assert.match(findings, /API-DATA-007.*\/presence/u)
})

test('blocks personal identity and destination literals in governed compositions', () => {
  const context = contextFor({
    'src/features/systems/registry/dossier/nexus/nexusSelectors.ts': [
      "export const owner = 'Sean Dinwiddie'",
      "export const destination = 'https://sdin.dev'",
    ].join('\n'),
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-006')).length, 2)
  assert.match(findings.join('\n'), /nexusSelectors\.ts:1/u)
  assert.match(findings.join('\n'), /nexusSelectors\.ts:2/u)
})

test('allows structural view tokens while presentation values come from props', () => {
  const context = contextFor({
    'src/views/bridge/chassis/utilityRail/utilityRailView.tsx': [
      'export const UtilityRail = ({ label, url }) => (',
      '  <a className="system-utility-rail" href={url} target="_blank">{label}</a>',
      ')',
    ].join('\n'),
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})

test('blocks route metadata literals and personal signal-metadata defaults', () => {
  const context = contextFor({
    'src/views/dossier/dossierView.tsx':
      'export const Dossier = () => <SignalMeta title="Dossier" description="Local copy" />',
    'src/features/systems/substrate/ui/presentation/signalMeta/signalMetaSelectors.ts':
      "export const defaultTitle = 'Sean Dinwiddie registry'",
  })
  const findings = collectApiDataAuthorityFindings(context)

  assert.equal(findings.filter((finding) => finding.includes('API-DATA-006')).length, 3)
  assert.match(findings.join('\n'), /dossierView\.tsx/u)
  assert.match(findings.join('\n'), /signalMetaSelectors\.ts/u)
})

test('requires the createApi root to live inside the system API boundary', () => {
  const outsideApi = `${projectRoot}/src/features/systems/substrate/kernel/note/noteApi.ts`
  const context = contextFor(
    {
      'src/features/systems/substrate/kernel/note/noteApi.ts':
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
    'src/views/telemetry/telemetryView.test.ts': [
      "import payload from '../../../data/initialState.json'",
      "export const load = () => fetch('/fixture')",
    ].join('\n'),
  })

  assert.deepEqual(collectApiDataAuthorityFindings(context), [])
})
