import assert from 'node:assert/strict'
import test from 'node:test'
import { FP_AST_RULES, collectFpAstFindingsFromSource } from './astConformance.mjs'

const stateFindings = (text) =>
  collectFpAstFindingsFromSource({
    text,
    filePath: 'src/features/session/sessionSlice.ts',
  }).filter(({ ruleId }) => ruleId === FP_AST_RULES.serializableState.id)
const stateReviewFindings = (text) =>
  collectFpAstFindingsFromSource({
    text,
    filePath: 'src/features/session/sessionSlice.ts',
  }).filter(({ ruleId }) => ruleId === FP_AST_RULES.unresolvedStateTypeReview.id)

test('later createSlice reducer assignment stores an aliased wrapper', () => {
  const findings = stateFindings(`
    import { createSlice as makeSlice } from '@reduxjs/toolkit'
    import { just as present } from 'functional-programming-composition'
    const initialState = { selected: null }
    const reducers = {
      select(state, action) { state.selected = present(action.payload) },
    }
    const config = { name: 'session', initialState, reducers }
    makeSlice(config)
  `)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].disposition, 'BLOCK')
  assert.match(findings[0].message, /constructor just.*reducer state/)
})

test('later reducer assignment of plain data remains valid', () => {
  assert.deepEqual(
    stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    const initialState = { selected: null }
    const reducers = {
      select(state, action) { state.selected = action.payload },
    }
    createSlice({ name: 'session', initialState, reducers })
  `),
    []
  )
})

test('returned createReducer state stores a namespace wrapper', () => {
  const findings = stateFindings(`
    import * as toolkit from '@reduxjs/toolkit'
    import * as fp from '../fp'
    const initialState = { error: null }
    const reducerMap = {
      failed: (state, action) => ({ ...state, error: fp.left(action.payload) }),
    }
    toolkit.createReducer(initialState, reducerMap)
  `)
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /constructor left.*reducer state/)
})

test('returned reducer state made only of plain values remains valid', () => {
  assert.deepEqual(
    stateFindings(`
    import { createReducer } from '@reduxjs/toolkit'
    const initialState = { error: null }
    const reducerMap = {
      failed: (state, action) => ({ ...state, error: action.payload }),
    }
    createReducer(initialState, reducerMap)
  `),
    []
  )
})

test('wrapper-typed Redux state fields follow aliased and namespace types', () => {
  const findings = stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    import { Maybe as Optional } from 'functional-programming-composition'
    import * as fp from '../fp'
    interface SessionState {
      selected: Optional<string>
      failure: fp.Either<string, never>
    }
    const initialState: SessionState = { selected: null as never, failure: null as never }
    createSlice({ name: 'session', initialState, reducers: {} })
  `)
  assert.equal(findings.length, 2)
  assert.ok(findings.every(({ disposition }) => disposition === 'BLOCK'))
  assert.match(findings.map(({ message }) => message).join('\n'), /type Maybe/)
  assert.match(findings.map(({ message }) => message).join('\n'), /type Either/)
})

test('plain Redux state type with an edge-lifted selector remains valid', () => {
  assert.deepEqual(
    stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    import { Maybe, fromNullable } from 'functional-programming-composition'
    interface SessionState { selected: string | null }
    const initialState: SessionState = { selected: null }
    createSlice({ name: 'session', initialState, reducers: {} })
    const selectMaybe = (state: SessionState): Maybe<string> => fromNullable(state.selected)
  `),
    []
  )
})

test('temporary wrapper lifting inside a reducer is consumed, not stored', () => {
  assert.deepEqual(
    stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    import { just, match } from 'functional-programming-composition'
    const initialState = { selected: null }
    const reducers = {
      select: (state, action) => ({
        ...state,
        selected: match(just(action.payload), (value) => value, () => null),
      }),
      inspect(state, action) {
        match(just(action.payload), (value) => value, () => null)
        state.selected = action.payload
      },
    }
    createSlice({ name: 'session', initialState, reducers })
  `),
    []
  )
})

test('createReducer builder reducers and identifier callbacks are inspected', () => {
  const findings = stateFindings(`
    import { createReducer } from '@reduxjs/toolkit'
    import { failure } from '../validation'
    const initialState = { result: null }
    const failed = (state, action) => { state.result = failure(action.payload) }
    const configure = (builder) => builder.addCase('failed', failed)
    createReducer(initialState, configure)
  `)
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /constructor failure.*reducer state/)
})

test('opaque createSlice configs are reviewed without crashing', () => {
  const direct = stateReviewFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    const makeConfig = () => ({ name: 'session', initialState: {}, reducers: {} })
    createSlice(makeConfig())
  `)
  const indirect = stateReviewFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    const makeConfig = () => ({ name: 'session', initialState: {}, reducers: {} })
    const config = makeConfig()
    createSlice(config)
  `)
  assert.equal(direct.length, 1)
  assert.equal(indirect.length, 1)
  assert.ok([...direct, ...indirect].every(({ disposition }) => disposition === 'REVIEW'))
  assert.match(direct[0].advice, /Read the complete fp skill/)
})

test('a local function sharing an RTK factory name is not Redux', () => {
  assert.deepEqual(
    stateFindings(`
    import { just, left } from '../maybe'
    const createSlice = (config) => config
    const createReducer = (state) => state
    createSlice({ initialState: { selected: just('edge value') } })
    createReducer({ error: left('edge error') })
  `),
    []
  )
})

test('literal tagged wrappers introduced initially or by a reducer are blocked', () => {
  const findings = stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    const initialState = { selected: { _tag: 'Nothing' } }
    createSlice({
      name: 'session',
      initialState,
      reducers: {
        fail: (state) => ({ ...state, selected: { _tag: 'Left', left: 'offline' } }),
      },
    })
  `)
  assert.equal(findings.length, 2)
  assert.match(findings.map(({ message }) => message).join('\n'), /Nothing/)
  assert.match(findings.map(({ message }) => message).join('\n'), /Left/)
})

test('unrelated tagged domain data remains valid', () => {
  assert.deepEqual(
    stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    const initialState = { status: { _tag: 'Docked', berth: 3 } }
    createSlice({ name: 'session', initialState, reducers: {} })
  `),
    []
  )
})

test('wrapper state types inherited through an interface are blocked', () => {
  const findings = stateFindings(`
    import { createReducer } from '@reduxjs/toolkit'
    import { Either as Outcome } from 'functional-programming-composition'
    interface BaseState { result: Outcome<string, number> }
    interface SessionState extends BaseState { turns: number }
    const initialState: SessionState = { result: null as never, turns: 0 }
    createReducer(initialState, () => undefined)
  `)
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /type Either/)
})

test('state-rooted collection mutators cannot store rich wrappers', () => {
  const findings = stateFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    import { just, left } from 'functional-programming-composition'
    const initialState = { items: [], errors: [] }
    createSlice({
      name: 'session',
      initialState,
      reducers: {
        add(state, action) { state.items.push(just(action.payload)) },
        fail(state, action) { state.errors.splice(0, 0, left(action.payload)) },
      },
    })
  `)
  assert.equal(findings.length, 2)
  assert.ok(findings.every(({ disposition }) => disposition === 'BLOCK'))
})

test('Object.assign into reducer state is inspected while plain mutations stay valid', () => {
  const findings = stateFindings(`
    import { createReducer } from '@reduxjs/toolkit'
    import { failure } from 'functional-programming-composition'
    const initialState = { result: null, count: 0 }
    createReducer(initialState, {
      failed(state, action) { Object.assign(state, { result: failure(action.payload) }) },
      counted(state) { state.count += 1 },
    })
  `)
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /constructor failure.*reducer state/)
})

test('imported or opaque Redux state shapes receive referenced review', () => {
  const findings = stateReviewFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    import type { SessionState } from './sessionTypes'
    import { makeInitialState } from './sessionAdapters'
    const initialState: SessionState = makeInitialState()
    createSlice({ name: 'session', initialState, reducers: {} })
  `)
  assert.equal(findings.length, 2)
  assert.ok(findings.every(({ disposition }) => disposition === 'REVIEW'))
  assert.match(findings.map(({ skillRef }) => skillRef).join('\n'), /SKILL\.md:321-341/)
})

test('Immer Draft is transparent and imported state reviews are deduplicated', () => {
  const findings = stateReviewFindings(`
    import { createSlice } from '@reduxjs/toolkit'
    import type { Draft } from 'immer'
    import type { SessionState } from './sessionTypes'
    const initialState = {} as SessionState
    createSlice({
      name: 'session', initialState,
      reducers: {
        first(state: Draft<SessionState>) { return state },
        second(state: Draft<SessionState>) { return state },
      },
    })
  `)
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /SessionState/)
  assert.doesNotMatch(findings[0].message, /Draft/)
})

test('unknown call results stored by reducers receive review instead of a guessed pass', () => {
  const findings = stateReviewFindings(`
    import { createReducer } from '@reduxjs/toolkit'
    const initialState = { selected: null }
    createReducer(initialState, {
      selected: (state, action) => ({
        ...state,
        selected: normalizeSelection(action.payload),
      }),
    })
  `)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].disposition, 'REVIEW')
  assert.match(findings[0].message, /call result.*reducer state/)
})
