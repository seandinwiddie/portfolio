import assert from 'node:assert/strict'
import test from 'node:test'

import {
  prefixViolation,
  suffixViolation,
  nestingViolation,
  subdomainCollisionViolations,
  isReExportBarrel,
  validateFeatureFile,
} from './check-feature-file-contract.mjs'

test('folder prefix and approved role suffix pass together', () => {
  assert.deepEqual(
    validateFeatureFile(
      '/repo/src/features/entities/portfolio/profile/body/bodySlice.ts'
    ),
    []
  )
  assert.deepEqual(
    validateFeatureFile(
      '/repo/src/features/systems/shell/controls/archiveControl/archiveControlAdapters.test.ts'
    ),
    []
  )
  assert.deepEqual(
    validateFeatureFile('/repo/src/features/systems/platform/foundation/api/apiApi.ts'),
    []
  )
})

test('the canonical domain file and a nested subdomain file both pass', () => {
  assert.deepEqual(
    nestingViolation('/repo/src/features/entities/map/mapSelectors.ts'),
    []
  )
  assert.deepEqual(
    nestingViolation('/repo/src/features/entities/map/route/routeSelectors.ts'),
    []
  )
  assert.deepEqual(
    nestingViolation(
      '/repo/src/features/entities/terminalSecurity/terminalSecuritySelectors.ts'
    ),
    []
  )
})

test('a concatenated subdomain filename is flagged and told to nest', () => {
  const findings = nestingViolation(
    '/repo/src/features/entities/map/mapRouteSelectors.ts'
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0], /FEATURE-FILE-003/)
  assert.match(findings[0], /map\/route\/routeSelectors\.ts/)
})

test('a concatenated subdomain test file nests under the subdomain folder', () => {
  const findings = nestingViolation(
    '/repo/src/features/entities/roaming/roamingFeralSelectors.test.ts'
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0], /roaming\/feral\/feralSelectors\.test\.ts/)
})

test('a longer unrelated token cannot masquerade as the exact folder prefix', () => {
  const findings = prefixViolation('/repo/src/features/entities/npc/npcxSlice.ts')
  assert.equal(findings.length, 1)
  assert.match(findings[0], /FEATURE-FILE-001/)
})

test('an exact prefix cannot hide an unapproved architectural suffix', () => {
  const findings = suffixViolation('/repo/src/features/entities/player/playerService.ts')
  assert.equal(findings.length, 1)
  assert.match(findings[0], /FEATURE-FILE-002/)
})

test('selector and requested selecter spellings remain explicitly accepted', () => {
  assert.deepEqual(
    suffixViolation('/repo/src/features/entities/item/itemSelectors.ts'),
    []
  )
  assert.deepEqual(
    suffixViolation('/repo/src/features/entities/item/itemSelecters.ts'),
    []
  )
})

test('the same subdomain name across different domains is allowed', () => {
  assert.deepEqual(
    subdomainCollisionViolations([
      '/repo/src/features/entities/portfolio/profile/body/catalog/catalogSelectors.ts',
      '/repo/src/features/entities/platform/observability/diagnostics/catalog/catalogSelectors.ts',
    ]),
    []
  )
})

test('a subdomain name reused within one domain is flagged as a collision', () => {
  const findings = subdomainCollisionViolations([
    '/repo/src/features/systems/portfolio/projects/projects/activity/activityAdapters.ts',
    '/repo/src/features/systems/portfolio/projects/projects/archive/activity/activityAdapters.ts',
  ])
  assert.equal(findings.length, 1)
  assert.match(findings[0], /FEATURE-FILE-004/)
  assert.match(findings[0], /"activity"/)
  assert.match(findings[0], /portfolio\/projects\/projects/)
})

test('a canonical domain file with no subdomains never collides', () => {
  assert.deepEqual(
    subdomainCollisionViolations([
      '/repo/src/features/entities/shell/themes/themeSelection/themeSelectionAdapters.ts',
      '/repo/src/features/systems/platform/foundation/api/apiAdapters.ts',
    ]),
    []
  )
})

test('a concern branch above a domain is never mistaken for a subdomain', () => {
  assert.deepEqual(
    subdomainCollisionViolations([
      '/repo/src/features/entities/shell/frame/brandName/brandNameSlice.ts',
      '/repo/src/features/entities/shell/frame/navigation/navigationSlice.ts',
      '/repo/src/features/entities/shell/themes/themeSelection/themeSelectionSlice.ts',
    ]),
    []
  )
})

test('re-export barrels are detected so they can be flagged to phase out', () => {
  assert.equal(
    isReExportBarrel("export { selectItemState } from './ledger/ledgerSelectors';"),
    true
  )
  assert.equal(isReExportBarrel("export * from './beats/beatsSelectors';"), true)
  assert.equal(
    isReExportBarrel(
      "export type { StationRegistry } from '../../components/registry/registryTypes';"
    ),
    true
  )
})

test('a module that only defines its own exports is not a barrel', () => {
  assert.equal(
    isReExportBarrel('export const selectItemState = (state) => state.item;'),
    false
  )
  assert.equal(
    isReExportBarrel("import { createSelector } from '@reduxjs/toolkit';"),
    false
  )
})
