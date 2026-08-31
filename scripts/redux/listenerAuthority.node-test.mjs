import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {
  collectCombatDefeatOwnerFindings,
  collectGameplayTurnOwnerFindings,
  collectListenerOrderSmells,
  listenerRegistrationsOf,
} from './listenerAuthority.mjs'
import { formatSkillReviewNotice } from './skillReviewNotices.mjs'

const projectRoot = path.resolve('virtual-app')
const sourceRoot = path.join(projectRoot, 'src')

const listenerOf = (effect) => `
  startAppListening({
    actionCreator: gameplayActions.actionCommitted,
    effect: (action, api) => { ${effect} },
  });
`

const aiListenerOf = (effect) => `
  startAppListening({
    actionCreator: aiActions.turnRequested,
    effect: (action, api) => { ${effect} },
  });
`

const defeatListenerOf = (effect) => `
  startAppListening({
    actionCreator: combatActions.npcDefeated,
    effect: (action, api) => { ${effect} },
  });
`

const combatMatcherOf = (effect) => `
  startAppListening({
    matcher: isAnyOf(
      combatActions.strikeLanded,
      combatActions.responseCommitted,
      combatActions.npcDefeated,
    ),
    effect: (action, api) => { ${effect} },
  });
`

const nonDefeatCombatMatcherOf = (effect) => `
  startAppListening({
    matcher: isAnyOf(
      combatActions.strikeLanded,
      combatActions.responseCommitted,
    ),
    effect: (action, api) => { ${effect} },
  });
`

/** Build one single-package checker context from direct source fixtures.
 * User Story: As a checker maintainer, I need listener authority laws tested without workspace discovery.
 * @signature const contextFor = (sources) => object
 */
const contextFor = (sources) => {
  const entries = sources.map((source, index) => [
    path.join(sourceRoot, 'features', `turn${index}`, `turn${index}Listeners.ts`),
    source,
  ])
  return {
    projectRoot,
    sourceFiles: entries.map(([filePath]) => filePath),
    readText: (filePath) => entries.find(([candidate]) => candidate === filePath)?.[1],
    relativeToProject: (filePath) => path.relative(projectRoot, filePath),
  }
}

test('flags a shared listener cohort that reads live state and dispatches nested work', () => {
  const context = contextFor([
    listenerOf(
      'const state = api.getState(); api.dispatch(aiActions.requested(state.turn));'
    ),
    listenerOf('api.dispatch(ecologyActions.balanced(api.getState().ecology));'),
  ])
  const [smell] = collectListenerOrderSmells(context)
  assert.match(smell.guidance, /gameplayActions\.actionCommitted has 2 listener owners/)
  assert.match(smell.guidance, /registration or import order/)
  assert.match(smell.guidance, /Agent judgment is required/)
  const formatted = formatSkillReviewNotice(smell).join('\n')
  assert.match(formatted, /orchestrate-side-effects-handle-side-effects\/SKILL\.md/)
  assert.match(formatted, /build-modern-redux-apps-redux-dataflow\/SKILL\.md/)
})

test('keeps payload-only and read-only sibling cohorts quiet', () => {
  const payloadOnly = contextFor([
    listenerOf('api.dispatch(aActions.recorded(action.payload));'),
    listenerOf('api.dispatch(bActions.recorded(action.payload));'),
  ])
  const readOnly = contextFor([
    listenerOf('void api.getState().player;'),
    listenerOf('void api.getState().ecology;'),
  ])
  assert.deepEqual(collectListenerOrderSmells(payloadOnly), [])
  assert.deepEqual(collectListenerOrderSmells(readOnly), [])
})

test('accepts exactly one gameplay turn listener owner', () => {
  assert.deepEqual(
    collectGameplayTurnOwnerFindings(contextFor([listenerOf('void action.payload;')])),
    []
  )
})

test('blocks multiple gameplay turn listener owners', () => {
  const findings = collectGameplayTurnOwnerFindings(
    contextFor([listenerOf('void action.payload;'), listenerOf('void action.payload;')])
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0], /expected exactly one listener owner, found 2/)
})

test('blocks a sibling owner of an orchestrated AI turn phase', () => {
  const findings = collectGameplayTurnOwnerFindings(
    contextFor([listenerOf('void action.payload;'), aiListenerOf('void api.getState();')])
  )
  assert.equal(findings.length, 1)
  assert.match(
    findings[0],
    /aiActions\.turnRequested: expected no sibling listener owners/
  )
})

test('accepts exactly one combat aftermath listener owner', () => {
  assert.deepEqual(
    collectCombatDefeatOwnerFindings(
      contextFor([
        defeatListenerOf('void action.payload;'),
        nonDefeatCombatMatcherOf('void api.getState().player;'),
      ])
    ),
    []
  )
})

test('enumerates every action creator inside an isAnyOf matcher', () => {
  const registrations = listenerRegistrationsOf(
    contextFor([combatMatcherOf('void action.payload;')])
  )
  assert.deepEqual(
    registrations.map(({ actionCreator }) => actionCreator),
    [
      'combatActions.strikeLanded',
      'combatActions.responseCommitted',
      'combatActions.npcDefeated',
    ]
  )
})

test('blocks the live direct aftermath plus matcher-based defeat cohort', () => {
  const context = contextFor([
    defeatListenerOf('api.dispatch(questActions.settled(action.payload));'),
    combatMatcherOf('void api.getState().player;'),
  ])
  const findings = collectCombatDefeatOwnerFindings(context)
  assert.equal(findings.length, 1)
  assert.match(findings[0], /expected exactly one aftermath workflow owner, found 2/)
  const [smell] = collectListenerOrderSmells(context)
  assert.match(smell.guidance, /combatActions\.npcDefeated has 2 listener owners/)
})
