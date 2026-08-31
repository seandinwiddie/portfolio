#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkApiEndpointTags } from './apiEndpointTags.mjs'
import { collectApiCompositionFindings } from './apiComposition.mjs'
import { collectApiStoreWiringFindings } from './apiStoreWiring.mjs'
import { collectDirectFetchFindings } from './directFetchChecks.mjs'
import {
  collectOpenApiCodegenFindings,
  collectOpenApiCodegenSmells,
} from './openApiCodegen.mjs'
import { createProjectContext } from './projectContext.mjs'
import { isRtkBoundaryFile, checkRoleBoundaries } from './roleBoundaries.mjs'
import { collectListenerWiringFindings } from './listenerWiring.mjs'
import {
  collectCombatDefeatOwnerFindings,
  collectGameplayTurnOwnerFindings,
} from './listenerAuthority.mjs'
import { ownedFactoryPatterns } from './roleRules.mjs'
import { collectReactReduxWiringFindings } from './reactReduxWiring.mjs'
import {
  collectSkillReviewNotices,
  formatSkillReviewNotice,
} from './skillReviewNotices.mjs'
import { collectStoreBoundaryFindings } from './storeBoundaries.mjs'
import { collectSelectorMemoizationReviews } from './selectorMemoization.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptDir, '../..')
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage:
  checkConformance.mjs [project-root]

Description:
  Runs Redux Toolkit / RTK Query conformance checks against a project root.

Behavior:
  - Defaults to the repository root.
  - Checks the root src/, app/, package.json, and src/store files for this Expo app.
  - Skips checks that do not apply to the target project shape.`)
  process.exit(0)
}

if (args.length > 1) {
  console.error('[fail] Expected zero or one project root argument.')
  process.exit(2)
}

const projectRoot = path.resolve(process.cwd(), args[0] ?? defaultRoot)
if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
  console.error(`[fail] Project root does not exist: ${projectRoot}`)
  process.exit(1)
}

const context = createProjectContext(projectRoot)
let status = 0
const fail = (message, lines = []) => {
  console.log(`[fail] ${message}`)
  lines.forEach((line) => console.log(line))
  status = 1
}
const warn = (message, lines = []) => {
  console.log(`[warn] ${message}`)
  lines.forEach((line) => console.log(line))
}

console.log('[check] RTK conformance guardrails')
console.log(`[path] project: ${projectRoot}`)
console.log(`[info] source files discovered: ${context.sourceFiles.length}`)
console.log(`[info] root manifest: ${context.relativeToProject(context.manifestFile)}`)
console.log(`[info] createApi files discovered: ${context.apiFiles.length}`)
console.log(`[info] root store files discovered: ${context.storeFiles.length}`)
console.log(
  `[info] configureStore assemblies discovered: ${context.configureStoreFiles.length}`
)

const storeFindings = collectStoreBoundaryFindings(context)
if (storeFindings.length) fail('Single root store boundary findings:', storeFindings)
else console.log('[ok] The app has one root store assembly boundary')

const reactReduxFindings = collectReactReduxWiringFindings(context)
if (reactReduxFindings.length) {
  fail('React-Redux Provider and typed-hook wiring findings:', reactReduxFindings)
} else {
  console.log(
    '[ok] React-Redux hooks are centralized, typed, and connected to the root Provider'
  )
}

const listenerWiringFindings = collectListenerWiringFindings(context)
if (listenerWiringFindings.length) {
  fail('Listener middleware wiring findings:', listenerWiringFindings)
} else {
  console.log('[ok] Listener middleware is prepended once and exposes typed registration')
}

const gameplayTurnOwnerFindings = collectGameplayTurnOwnerFindings(context)
if (gameplayTurnOwnerFindings.length) {
  fail('Gameplay turn listener ownership findings:', gameplayTurnOwnerFindings)
} else {
  console.log('[ok] Gameplay turns have one explicit listener workflow owner')
}

const combatDefeatOwnerFindings = collectCombatDefeatOwnerFindings(context)
if (combatDefeatOwnerFindings.length) {
  fail('Combat aftermath listener ownership findings:', combatDefeatOwnerFindings)
} else {
  console.log('[ok] Combat defeat has one explicit aftermath workflow owner')
}

const longFiles = context.sourceFiles
  .map((filePath) => ({ filePath, lines: context.lineCount(context.readText(filePath)) }))
  .filter(({ lines }) => lines > 300)
  .map(({ filePath, lines }) => `${lines} ${filePath}`)
if (longFiles.length) fail('Source files over 300 lines:', longFiles)
else console.log('[ok] Source file length check passed')

const mswManifest =
  fs.existsSync(context.manifestFile) &&
  context.fileContains(context.manifestFile, /"msw"/)
    ? [`${context.manifestFile}: found "msw"`]
    : []
if (mswManifest.length) fail('Found msw dependency in the root manifest', mswManifest)
else console.log('[ok] No msw dependency in the root manifest')

const mswSource = context.sourceFiles
  .filter((filePath) => context.fileContains(filePath, /\bmsw\b/))
  .map((filePath) => `${filePath}: found msw`)
if (mswSource.length) fail('Found msw usage in first-party source', mswSource)
else console.log('[ok] No msw usage in first-party source')

const legacyHits = context.sourceFiles
  .filter((filePath) =>
    context.fileContains(
      filePath,
      /['"]\/speak|['"]\/dialogue|npc_speak|npc_dialogue|postSpeak|postDialogue/
    )
  )
  .map((filePath) => `${filePath}: legacy speak/dialogue pattern found`)
if (legacyHits.length) fail('Found banned legacy speak/dialogue paths', legacyHits)
else console.log('[ok] No banned legacy speak/dialogue paths found')

const rtkBoundaryHits = context.sourceFiles
  .filter((filePath) => !isRtkBoundaryFile(context, filePath))
  .flatMap((filePath) => {
    const text = context.readText(filePath)
    const findings = []
    const rtkImport = text.match(
      /from\s+['"]@reduxjs\/toolkit(?:\/query)?['"]|require\s*\(\s*['"]@reduxjs\/toolkit(?:\/query)?['"]\s*\)/
    )
    if (rtkImport) {
      findings.push(
        `${filePath}:${context.lineNumber(text, rtkImport.index ?? 0)}: Redux Toolkit import outside ECS ownership domains/root store`
      )
    }
    for (const [ownerRole, pattern] of Object.entries(ownedFactoryPatterns)) {
      const match = pattern.exec(text)
      if (match) {
        findings.push(
          `${filePath}:${context.lineNumber(text, match.index)}: ${ownerRole} factory outside ECS ownership domains/root store`
        )
      }
    }
    return findings
  })
if (rtkBoundaryHits.length)
  fail('Redux Toolkit usage outside ECS ownership domains/root store:', rtkBoundaryHits)
else console.log('[ok] Redux Toolkit usage stays inside ECS ownership domains/root store')

if (context.sourceFiles.length) {
  const directFetchHits = collectDirectFetchFindings(context)
  if (directFetchHits.length)
    fail('Direct fetch found outside approved RTK/fetch wrapper files', directFetchHits)
  else console.log('[ok] No direct fetch outside approved wrapper files')
} else {
  console.log('[skip] No source files discovered for direct-fetch analysis')
}

const endpointTagReviews = checkApiEndpointTags(context, fail)
checkRoleBoundaries(context, fail)
const apiCompositionFindings = collectApiCompositionFindings(context)
if (apiCompositionFindings.length) {
  fail('RTK Query API composition findings:', apiCompositionFindings)
} else {
  console.log(
    '[ok] Split endpoint domains extend one createApi root through injectEndpoints'
  )
}
const apiStoreWiringFindings = collectApiStoreWiringFindings(context)
if (apiStoreWiringFindings.length) {
  fail('RTK Query store wiring findings:', apiStoreWiringFindings)
} else if (context.apiFiles.length) {
  console.log(
    '[ok] Every createApi reducer and middleware are wired into the app root configureStore'
  )
} else {
  console.log('[skip] No createApi store wiring to inspect')
}
const openApiCodegenFindings = collectOpenApiCodegenFindings(context)
if (openApiCodegenFindings.length) {
  fail('RTK Query OpenAPI codegen findings:', openApiCodegenFindings)
} else {
  console.log('[ok] OpenAPI codegen extends a shared empty API when configured')
}

if (context.sourceFiles.length) {
  const singletonCaches = context.sourceFiles
    .filter((filePath) =>
      context.fileContains(filePath, /^const _[A-Za-z0-9_]+:\s*Record/m)
    )
    .map((filePath) => `${filePath}: mutable singleton cache pattern found`)
  if (singletonCaches.length) warn('Mutable singleton caches found:', singletonCaches)
  else console.log('[ok] No mutable singleton caches found')
} else {
  console.log('[skip] No source files discovered for singleton-cache analysis')
}

if (context.storeFiles.length) {
  const forbiddenSerializableExemptions = [
    [/serializableCheck\s*:\s*false/, 'serializableCheck is blanket-disabled'],
    [
      /ignoredPaths\s*:\s*\[[^\]]*['"]api['"][^\]]*\]/s,
      'the entire RTK Query api state is ignored',
    ],
    [
      /ignoredActionPaths\s*:\s*\[[^\]]*['"]payload['"][^\]]*\]/s,
      'every action payload is ignored',
    ],
    [
      /ignoredActions\s*:\s*\[[^\]]*['"]api\/execute(?:Query|Mutation)\//s,
      'RTK Query lifecycle actions are ignored',
    ],
  ]
  const serializableHits = context.storeFiles.flatMap((filePath) => {
    const text = context.readText(filePath)
    return forbiddenSerializableExemptions
      .filter(([pattern]) => pattern.test(text))
      .map(([, summary]) => `${context.relativeToProject(filePath)}: ${summary}`)
  })
  if (serializableHits.length) {
    fail('Store serializability checks contain broad exemptions:', serializableHits)
  } else {
    console.log('[ok] Store serializability checks have no broad exemptions')
  }
} else {
  console.log('[skip] No configureStore files discovered')
}

console.log('')
console.log('[notice] Non-blocking Redux skill REVIEW/SMELL notices')
;[
  ...collectSkillReviewNotices(context),
  ...endpointTagReviews,
  ...collectSelectorMemoizationReviews(context),
  ...collectOpenApiCodegenSmells(context),
].forEach((notice) => {
  formatSkillReviewNotice(notice).forEach((line) => console.log(line))
})

console.log('')
console.log(`[done] RTK conformance check complete (exit ${status})`)
process.exit(status)
