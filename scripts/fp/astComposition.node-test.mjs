import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FP_AST_RULES,
  classifyFpSourceScope,
  collectFpAstFindingsForUnits,
  collectFpAstFindingsFromSource,
} from './astConformance.mjs'

const findingsFor = (text, filePath = 'src/features/entities/order/orderSelectors.ts') =>
  collectFpAstFindingsFromSource({ text, filePath })
const byRule = (rule, text, filePath) =>
  findingsFor(text, filePath).filter(({ ruleId }) => ruleId === rule.id)

test('nested conditional chains block in functional core', () => {
  const [finding] = byRule(
    FP_AST_RULES.conditionalChain,
    "const label = (kind) => kind === 'a' ? 'A' : kind === 'b' ? 'B' : 'C'"
  )
  assert.equal(finding.disposition, 'BLOCK')
  assert.match(finding.skillRef, /SKILL\.md:230-242;.*SKILL\.md:446-467$/)
  assert.equal(finding.guidance, 'A ternary chain is an `if` that learned to hide.')
})

test('single leaf ternary remains valid', () => {
  assert.deepEqual(
    byRule(FP_AST_RULES.conditionalChain, 'const label = (ok) => ok ? "yes" : "no"'),
    []
  )
})

test('a conditional nested in the condition is still a ternary chain', () => {
  const [finding] = byRule(
    FP_AST_RULES.conditionalChain,
    'const label = (ready) => (ready ? true : false) ? "yes" : "no"'
  )
  assert.equal(finding?.disposition, 'BLOCK')
})

test('nested conditional chains remain visible as REVIEW at view edges', () => {
  const [finding] = byRule(
    FP_AST_RULES.conditionalChain,
    "const label = (kind) => kind === 'a' ? 'A' : kind === 'b' ? 'B' : 'C'",
    'src/views/order/orderView.tsx'
  )
  assert.equal(finding.disposition, 'REVIEW')
})

test('nested compose blocks while pipe composition remains valid', () => {
  const [finding] = byRule(
    FP_AST_RULES.nestedCompose,
    'const transform = compose(compose(trim, lower), slug)'
  )
  assert.equal(finding.disposition, 'BLOCK')
  assert.match(finding.skillRef, /\/\.agents\/skills\/fp\/SKILL\.md:304-307$/)
  assert.equal(
    finding.guidance,
    'No hand-composed `compose(compose(...))`. Use `pipe` / `fold`.'
  )
  assert.deepEqual(
    byRule(FP_AST_RULES.nestedCompose, 'const transform = pipe(trim, lower, slug)'),
    []
  )
})

test('named compose import aliases retain nested-compose enforcement', () => {
  const [finding] = byRule(
    FP_AST_RULES.nestedCompose,
    `
    import { compose as flow } from 'functional-programming-composition'
    const transform = flow(flow(trim, lower), slug)
  `
  )
  assert.equal(finding?.disposition, 'BLOCK')
  assert.deepEqual(
    byRule(FP_AST_RULES.nestedCompose, 'const transform = flow(flow(trim, lower), slug)'),
    []
  )
})

test('direct self-recursion is a non-blocking boundedness smell', () => {
  const [finding] = byRule(
    FP_AST_RULES.directRecursion,
    `
    const sum = (items, index = 0) =>
      index >= items.length ? 0 : items[index] + sum(items, index + 1)
  `
  )
  assert.equal(finding.disposition, 'SMELL')
  assert.equal(finding.level, 'review')
  assert.match(
    finding.skillRef,
    /SKILL\.md:260-283;.*SKILL\.md:343-369;.*SKILL\.md:515-536$/
  )
})

test('direct self-recursion inside a match callback remains visible', () => {
  const findings = findingsFor(`
    const walk = (cursor: Cursor): boolean => match(
      next(cursor),
      (value) => walk(value),
      () => false,
    );
  `)
  assert.equal(findings.filter(({ ruleId }) => ruleId === 'FP-AST-009').length, 1)
  assert.equal(
    findings.find(({ ruleId }) => ruleId === 'FP-AST-009')?.disposition,
    'SMELL'
  )
})

test('folds and Bounce-deferred recursion do not trigger direct-recursion smell', () => {
  assert.deepEqual(
    byRule(
      FP_AST_RULES.directRecursion,
      'const sum = (items) => items.reduce((total, item) => total + item, 0)'
    ),
    []
  )
  assert.deepEqual(
    byRule(
      FP_AST_RULES.directRecursion,
      `
    const sum = (items, index = 0) =>
      index >= items.length ? done(0) : call(() => sum(items, index + 1))
  `
    ),
    []
  )
})

test('an arbitrary object .call does not masquerade as Bounce deferral', () => {
  const [finding] = byRule(
    FP_AST_RULES.directRecursion,
    `
    const walk = (cursor) => scheduler.call(() => walk(next(cursor)))
  `
  )
  assert.equal(finding?.disposition, 'SMELL')
})

test('self aliases are class-mechanic findings', () => {
  const [finding] = byRule(
    FP_AST_RULES.classMechanics,
    'const read = (self) => self.value'
  )
  assert.match(finding.message, /`self` class alias/)
  assert.equal(finding.disposition, 'BLOCK')
})

test('canonical typed options cheating is blocking when three fields are consumed', () => {
  const [finding] = byRule(
    FP_AST_RULES.payloadArity,
    `
    type RenderOptions = { row: Row; theme: Theme; locale: Locale; active: boolean }
    const render = (opts: RenderOptions) => layout(opts.row, opts.theme, opts.locale)
  `
  )
  assert.equal(finding.disposition, 'BLOCK')
  assert.match(finding.message, /3 independently accessed responsibilities/)
})

test('direct typed Options destructuring blocks only in core', () => {
  const source = `
    type Options = { row: Row; theme: Theme; locale: Locale; onClick: EventHandler }
    const render = ({ row, theme, locale, onClick }: Options) => row
  `
  const [core] = byRule(FP_AST_RULES.payloadArity, source)
  assert.equal(core.disposition, 'BLOCK')
  const [view] = byRule(
    FP_AST_RULES.payloadArity,
    source,
    'src/views/order/orderView.tsx'
  )
  assert.equal(view.disposition, 'REVIEW')
})

test('injected dependency objects and literal Fixture domain names stay review-only', () => {
  const [payload] = byRule(
    FP_AST_RULES.payloadArity,
    `
    const run = (deps) => {
      const { read, write, notify } = deps
      return read()
    }
  `
  )
  assert.equal(payload.disposition, 'REVIEW')
  const [fixture] = byRule(
    FP_AST_RULES.wrapperNoun,
    'type StationFixture = { id: string }'
  )
  assert.equal(fixture.disposition, 'REVIEW')
  const [embeddedFixture] = byRule(
    FP_AST_RULES.wrapperNoun,
    'type FixtureItemRow = { id: string }'
  )
  assert.equal(embeddedFixture.disposition, 'REVIEW')
  const [embeddedManager] = byRule(
    FP_AST_RULES.wrapperNoun,
    'const RequestManagerFactory = () => ({})'
  )
  assert.equal(embeddedManager.disposition, 'REVIEW')
})

test('imported callback-signaling types are excluded from data arity', () => {
  assert.deepEqual(
    byRule(
      FP_AST_RULES.dataArity,
      `
    import type { EventHandler } from './events'
    const route = (event: Event, state: State, onDone: EventHandler) => state
  `
    ),
    []
  )
})

test('source scope classification is explicit for core, boundary, and adapters', () => {
  assert.equal(classifyFpSourceScope('src/features/entities/map/mapSelectors.ts'), 'core')
  assert.equal(classifyFpSourceScope('src/features/entities/map/mapSlice.ts'), 'core')
  assert.equal(
    classifyFpSourceScope('src/features/systems/game/authorityReducers.ts'),
    'core'
  )
  assert.equal(classifyFpSourceScope('app/index.tsx'), 'boundary')
  assert.equal(classifyFpSourceScope('src/views/map/mapView.tsx'), 'boundary')
  assert.equal(classifyFpSourceScope('src/features/game/gameThunks.ts'), 'boundary')
  assert.equal(classifyFpSourceScope('src/features/game/gameListeners.ts'), 'boundary')
  assert.equal(
    classifyFpSourceScope('src/features/systems/audio/audioAdapters.ts'),
    'boundary'
  )
  assert.equal(
    classifyFpSourceScope('src/features/systems/persistence/saveAdapters.ts'),
    'boundary'
  )
  assert.equal(
    classifyFpSourceScope('src/features/components/quest/questTypes.ts'),
    'core'
  )
  assert.equal(
    classifyFpSourceScope('src/features/systems/quest/fetch/fetchAdapters.ts'),
    'core'
  )
  assert.equal(classifyFpSourceScope('src/components/StationPanel.ts'), 'boundary')
  assert.equal(classifyFpSourceScope('src/ui/StationPanel.tsx'), 'boundary')
  assert.equal(classifyFpSourceScope('src/store.ts'), 'boundary')
  assert.equal(classifyFpSourceScope('src/index.ts'), 'boundary')
  assert.equal(
    classifyFpSourceScope('src/features/systems/map/mapAdapters.ts'),
    'ambiguous'
  )
})

test('control statements emit REVIEW rather than disappearing outside core', () => {
  const [boundary] = byRule(
    FP_AST_RULES.controlStatement,
    'const run = (ready) => { if (ready) start() }',
    'src/features/game/gameListeners.ts'
  )
  assert.equal(boundary.disposition, 'REVIEW')
  assert.equal(boundary.scope, 'boundary')
  const [ambiguous] = byRule(
    FP_AST_RULES.controlStatement,
    'const run = (ready) => { if (ready) start() }',
    'src/features/systems/map/mapAdapters.ts'
  )
  assert.equal(ambiguous.disposition, 'REVIEW')
  assert.equal(ambiguous.scope, 'ambiguous')
  const [core] = byRule(
    FP_AST_RULES.controlStatement,
    'const run = (ready) => { if (ready) start() }'
  )
  assert.equal(core.disposition, 'BLOCK')
  assert.equal(core.scope, 'core')
})

test('batch collector permits only one trampoline driver across all units', () => {
  const driver = `
    /** @fp-trampoline-driver */
    const trampoline = (bounce) => {
      while (bounce.more) bounce = bounce.next()
      return bounce.value
    }
  `
  const context = { projectRoot: process.cwd() }
  const one = collectFpAstFindingsForUnits(context, [
    {
      rel: 'src/core/trampoline.ts',
      filePath: 'src/core/trampoline.ts',
      text: driver,
    },
  ])
  assert.equal(one.filter(({ disposition }) => disposition === 'BLOCK').length, 0)
  assert.equal(
    one.filter(({ ruleId }) => ruleId === FP_AST_RULES.documentedException.id).length,
    1
  )
  const two = collectFpAstFindingsForUnits(context, [
    { rel: 'src/core/trampoline.ts', filePath: 'src/core/trampoline.ts', text: driver },
    {
      rel: 'src/core/otherTrampoline.ts',
      filePath: 'src/core/otherTrampoline.ts',
      text: driver,
    },
  ])
  assert.equal(
    two.filter(({ ruleId }) => ruleId === FP_AST_RULES.controlStatement.id).length,
    2
  )
})

test('createSlice config identifiers retain rich-state enforcement metadata', () => {
  const [finding] = byRule(
    FP_AST_RULES.serializableState,
    `
    import { createSlice } from '@reduxjs/toolkit'
    import { left } from 'functional-programming-composition'
    const config = { name: 'status', initialState: { error: left('offline') }, reducers: {} }
    createSlice(config)
  `
  )
  assert.equal(finding.disposition, 'BLOCK')
  assert.match(finding.skillRef, /\/\.agents\/skills\/fp\/SKILL\.md:321-341$/)
})
