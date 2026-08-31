import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FP_AST_MARKER_DOCUMENTATION,
  FP_AST_RULES,
  FP_SKILL_GUIDANCE,
  FRAMEWORK_CLASS_MARKER,
  TRAMPOLINE_DRIVER_MARKER,
  collectFpAstFindingsFromSource,
  formatFpAstFinding,
  isRuntimeSourcePath,
} from './astConformance.mjs'

const findingsFor = (text, filePath = 'src/domain/orderFlow.ts') =>
  collectFpAstFindingsFromSource({ text, filePath })
const ruleFindings = (rule, text, filePath) =>
  findingsFor(text, filePath).filter((finding) => finding.ruleId === rule.id)

test('class declarations and every requested class mechanic are collected', () => {
  const findings = ruleFindings(
    FP_AST_RULES.classMechanics,
    `
    class Counter extends Base {
      constructor() { super() }
      next() { return this.value }
    }
    const counter = new Counter()
  `
  )
  assert.equal(findings.length, 5)
  assert.match(findings.map(({ message }) => message).join('\n'), /class Counter/)
  assert.match(findings.map(({ message }) => message).join('\n'), /inheritance/)
  assert.match(findings.map(({ message }) => message).join('\n'), /`super`/)
  assert.match(findings.map(({ message }) => message).join('\n'), /`this`/)
  assert.match(findings.map(({ message }) => message).join('\n'), /`new`/)
})

test('collector parses JavaScript runtime source as AST rather than TypeScript-only text', () => {
  const findings = findingsFor(
    'class Counter {}\nconst run = (a, b, c) => { if (a) return new Counter() }',
    'src/domain/orderFlow.js'
  )
  assert.ok(findings.some(({ ruleId }) => ruleId === FP_AST_RULES.classMechanics.id))
  assert.ok(findings.some(({ ruleId }) => ruleId === FP_AST_RULES.controlStatement.id))
  assert.ok(findings.some(({ ruleId }) => ruleId === FP_AST_RULES.dataArity.id))
})

test('documented thin framework class annotation is a narrow positive exception', () => {
  const findings = findingsFor(`
    /** @fp-framework-boundary Custom Elements requires inheritance. */
    export class StationElement extends HTMLElement {
      connectedCallback() { return this.render() }
    }
    const element = new StationElement()
  `)
  assert.equal(findings.filter(({ disposition }) => disposition === 'BLOCK').length, 0)
  assert.equal(
    ruleFindings(
      FP_AST_RULES.documentedException,
      `
    /** @fp-framework-boundary Custom Elements requires inheritance. */
    export class StationElement extends HTMLElement {
      connectedCallback() { return this.render() }
    }
  `
    ).length,
    1
  )
})

test('framework class marker requires a reason', () => {
  const findings = ruleFindings(
    FP_AST_RULES.classMechanics,
    `
    /** @fp-framework-boundary */
    class StationElement extends HTMLElement {}
  `
  )
  assert.ok(findings.length >= 2)
})

test('framework class marker does not exempt a stateful or broad class', () => {
  const findings = ruleFindings(
    FP_AST_RULES.classMechanics,
    `
    /** @fp-framework-boundary Framework callback API requires a class. */
    class StationElement {
      state = 0
      start() { return this.state }
    }
  `
  )
  assert.ok(findings.length >= 2)
  assert.match(findings[0].message, /not a thin annotated framework boundary/)
})

test('if, for, for-in, for-of, while, do, and switch statements are collected', () => {
  const findings = ruleFindings(
    FP_AST_RULES.controlStatement,
    `
    const run = (items, record) => {
      if (record.ready) consume(record)
      for (let index = 0; index < items.length; index += 1) consume(items[index])
      for (const key in record) consume(key)
      for (const item of items) consume(item)
      while (ready()) consume(record)
      do consume(record); while (ready())
      switch (record.kind) { default: consume(record) }
    }
  `
  )
  assert.equal(findings.length, 7)
})

test('leaf expressions, dispatch tables, and folds remain valid', () => {
  assert.deepEqual(
    findingsFor(`
    const labels = { ready: 'Ready', idle: 'Idle' }
    const label = (kind) => labels[kind] ?? 'Unknown'
    const total = (values) => values.reduce((sum, value) => sum + value, 0)
    const present = (value) => value == null ? 'missing' : 'present'
  `),
    []
  )
})

test('documented trampoline driver exempts exactly its owned loop', () => {
  const findings = findingsFor(`
    /** @fp-trampoline-driver */
    export const trampoline = (bounce) => {
      let current = bounce
      while (current._tag === 'Call') current = current.next()
      return current.value
    }
  `)
  assert.equal(
    ruleFindings(
      FP_AST_RULES.controlStatement,
      `
    /** @fp-trampoline-driver */
    export const trampoline = (bounce) => {
      while (bounce._tag === 'Call') bounce = bounce.next()
      return bounce.value
    }
  `
    ).length,
    0
  )
  assert.equal(
    findings.filter(({ ruleId }) => ruleId === FP_AST_RULES.documentedException.id)
      .length,
    1
  )
})

test('trampoline marker is rejected on the wrong name or multiple loops', () => {
  const wrongName = ruleFindings(
    FP_AST_RULES.controlStatement,
    `
    /** @fp-trampoline-driver */
    const drive = (bounce) => { while (bounce.more) bounce = bounce.next() }
  `
  )
  assert.equal(wrongName.length, 1)
  const multiple = ruleFindings(
    FP_AST_RULES.controlStatement,
    `
    /** @fp-trampoline-driver */
    const trampoline = (bounce) => {
      while (bounce.more) bounce = bounce.next()
      while (bounce.pending) bounce = bounce.next()
    }
  `
  )
  assert.equal(multiple.length, 2)
})

test('functions with more than two data parameters are collected', () => {
  const findings = ruleFindings(
    FP_AST_RULES.dataArity,
    'const render = (row, theme, locale) => row'
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /3 data parameters/)
})

test('statically typed function parameters are excluded from data arity', () => {
  assert.deepEqual(
    findingsFor(`
    type Completion = (value: string) => void
    const render = (
      row: Row,
      theme: Theme,
      complete: Completion,
      fail: (reason: Error) => void,
    ) => row
  `),
    []
  )
})

test('untyped parameters called as functions are behavior, not data', () => {
  assert.deepEqual(
    ruleFindings(
      FP_AST_RULES.dataArity,
      'const render = (row, theme, complete) => complete(row)'
    ),
    []
  )
  assert.equal(
    ruleFindings(FP_AST_RULES.dataArity, 'const render = (row, theme, completion) => row')
      .length,
    1
  )
})

test('direct object destructuring cannot hide three responsibilities', () => {
  const findings = ruleFindings(
    FP_AST_RULES.payloadArity,
    'const render = ({ row, theme, locale }) => row'
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /3 destructured responsibilities/)
})

test('sole-use options immediately destructured in the body are collected', () => {
  const findings = ruleFindings(
    FP_AST_RULES.payloadArity,
    `
    const render = (options) => {
      const { row, theme, locale, onSelect } = options
      return row
    }
  `
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0].message, /only hides 4/)
})

test('domain object retained as a value is not called a mere arity disguise', () => {
  assert.deepEqual(
    findingsFor(`
    const render = (order) => {
      const { id, lines, status } = order
      return summarize(order, id, lines, status)
    }
  `).filter(({ ruleId }) => ruleId === FP_AST_RULES.payloadArity.id),
    []
  )
})

test('forbidden wrapper nouns are collected in runtime filename and declarations', () => {
  const findings = ruleFindings(
    FP_AST_RULES.wrapperNoun,
    `
    const requestManager = () => undefined
    function makeHelper() {}
    interface DataUtils {}
    const stateBag = {}
    type ShapeFixture = { value: string }
  `,
    'src/domain/requestHelper.ts'
  )
  assert.equal(findings.length, 6)
})

test('related but non-forbidden role names remain valid', () => {
  assert.deepEqual(
    findingsFor(
      `
    const managerialPolicy = () => undefined
    const helpfulMessage = 'ready'
    type UtilityValue = string
  `,
      'src/domain/orderManagement.ts'
    ),
    []
  )
})

test('rich Maybe constructors and values in createSlice initial state are collected', () => {
  const findings = ruleFindings(
    FP_AST_RULES.serializableState,
    `
    import { createSlice } from '@reduxjs/toolkit'
    import { just, nothing } from 'functional-programming-composition'
    const initialState = { selected: nothing, active: just('station') }
    createSlice({ name: 'selection', initialState, reducers: {} })
  `
  )
  assert.equal(findings.length, 2)
  assert.match(findings.map(({ message }) => message).join('\n'), /nothing/)
  assert.match(findings.map(({ message }) => message).join('\n'), /just/)
})

test('aliased and namespace FP wrappers in Redux initial state are collected', () => {
  const findings = ruleFindings(
    FP_AST_RULES.serializableState,
    `
    import { createReducer } from '@reduxjs/toolkit'
    import { just as present } from 'functional-programming-composition'
    import * as fp from '../fp'
    const initialState = { selected: present('station'), error: fp.left('offline') }
    createReducer(initialState, (builder) => builder)
  `
  )
  assert.equal(findings.length, 2)
})

test('lazy createSlice initializers are inspected but edge lifting is not', () => {
  const stored = ruleFindings(
    FP_AST_RULES.serializableState,
    `
    import { createSlice } from '@reduxjs/toolkit'
    import { right } from '../either'
    createSlice({
      name: 'station',
      initialState: () => ({ status: right('ready') }),
      reducers: {},
    })
  `
  )
  assert.equal(stored.length, 1)
  const edge = ruleFindings(
    FP_AST_RULES.serializableState,
    `
    import { just } from '../maybe'
    const selectStation = (state) => just(state.station.selected)
  `
  )
  assert.deepEqual(edge, [])
})

test('plain serializable Redux initial state remains valid', () => {
  assert.deepEqual(
    findingsFor(`
    import { createSlice } from '@reduxjs/toolkit'
    const initialState = { selected: null, errors: [] }
    createSlice({ name: 'selection', initialState, reducers: {} })
  `),
    []
  )
})

test('test-only paths are outside runtime enforcement', () => {
  assert.equal(isRuntimeSourcePath('src/domain/orderFlow.ts'), true)
  assert.equal(isRuntimeSourcePath('src/domain/__tests__/orderManager.test.ts'), false)
  assert.deepEqual(
    findingsFor(
      `
    class RequestManager {}
    const run = (a, b, c) => { if (a) return new RequestManager() }
  `,
      'src/domain/__tests__/orderManager.test.ts'
    ),
    []
  )
})

test('every finding carries file, line, column, and verbatim skill guidance', () => {
  const [finding] = findingsFor('const run = (a, b, c) => a', 'src/domain/flow.ts')
  assert.equal(finding.file, 'src/domain/flow.ts')
  assert.equal(finding.line, 1)
  assert.ok(finding.column > 0)
  assert.equal(finding.guidance, FP_SKILL_GUIDANCE.arity)
  assert.match(finding.skillRef, /\.agents\/skills\/fp\/SKILL\.md:\d/i)
  assert.match(finding.advice, /Read the complete fp skill/)
  assert.match(formatFpAstFinding(finding), /^src\/domain\/flow\.ts:1:\d+:/)
})

test('exception marker documentation is exported beside the collector', () => {
  assert.match(
    FP_AST_MARKER_DOCUMENTATION[FRAMEWORK_CLASS_MARKER],
    /framework or reflection reason/
  )
  assert.match(FP_AST_MARKER_DOCUMENTATION[TRAMPOLINE_DRIVER_MARKER], /Exactly one loop/)
})
