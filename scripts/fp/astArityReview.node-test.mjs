import assert from 'node:assert/strict'
import test from 'node:test'

import { collectFpAstFindingsFromSource } from './astConformance.mjs'

const findingsFor = (text) =>
  collectFpAstFindingsFromSource({
    text,
    filePath: 'src/features/entities/demo/demoSelectors.ts',
  })

const arityFindings = (text) =>
  findingsFor(text).filter(
    ({ ruleId }) => ruleId === 'FP-AST-003' || ruleId === 'FP-AST-011'
  )
const payloadFindings = (text) =>
  findingsFor(text).filter(({ ruleId }) => ruleId === 'FP-AST-004')

test('unresolved callback-looking types cannot silently hide over-arity', () => {
  const [finding] = arityFindings(`
    import type { RenderHandler } from './types';
    const render = (left: Data, right: Data, handler: RenderHandler) => handler(left, right);
  `)
  assert.equal(finding?.ruleId, 'FP-AST-011')
  assert.equal(finding?.disposition, 'REVIEW')
  assert.match(finding?.skillRef ?? '', /SKILL\.md:54-57/)
  assert.match(finding?.advice ?? '', /Read the complete fp skill/)
})

test('a locally proven callable type is excluded from data arity', () => {
  assert.deepEqual(
    arityFindings(`
    type RenderHandler = (left: Data, right: Data) => Output;
    const render = (left: Data, right: Data, handler: RenderHandler) => handler(left, right);
  `),
    []
  )
})

test('a callback-named local data alias remains a data parameter', () => {
  const [finding] = arityFindings(`
    type RenderHandler = { mode: string };
    const render = (left: Data, right: Data, handler: RenderHandler) => handler.mode;
  `)
  assert.equal(finding?.ruleId, 'FP-AST-003')
  assert.equal(finding?.disposition, 'BLOCK')
})

test('a callable-or-nullish union remains provably behavior', () => {
  assert.deepEqual(
    arityFindings(`
    type RenderHandler = (value: Data) => Output;
    const render = (left: Data, right: Data, handler: RenderHandler | undefined) =>
      handler?.(left) ?? right;
  `),
    []
  )
})

test('a callable-or-data union counts as data instead of escaping the guard', () => {
  const [finding] = arityFindings(`
    type RenderHandler = (value: Data) => Output;
    const render = (left: Data, right: Data, handler: RenderHandler | string) => right;
  `)
  assert.equal(finding?.ruleId, 'FP-AST-003')
  assert.equal(finding?.disposition, 'BLOCK')
})

test('a called unresolved imported type receives callback REVIEW', () => {
  const [finding] = arityFindings(`
    import type { Renderer } from './types';
    const render = (left: Data, right: Data, renderer: Renderer) => renderer(left, right);
  `)
  assert.equal(finding?.ruleId, 'FP-AST-011')
  assert.equal(finding?.disposition, 'REVIEW')
})

test('more than two provable data parameters still BLOCK with uncertain behavior', () => {
  const [finding] = arityFindings(`
    import type { Renderer } from './types';
    const render = (left: Data, middle: Data, right: Data, renderer: Renderer) =>
      renderer(left, right);
  `)
  assert.equal(finding?.ruleId, 'FP-AST-003')
  assert.equal(finding?.disposition, 'BLOCK')
})

test('imported options types cannot hide three uniquely accessed fields', () => {
  const [finding] = payloadFindings(`
    import type { RenderOptions } from './types';
    const render = (options: RenderOptions) =>
      layout(options.row, options.theme, options.locale);
  `)
  assert.equal(finding?.disposition, 'BLOCK')
  assert.match(finding?.message ?? '', /3 independently accessed/)
  assert.deepEqual(
    payloadFindings(`
    import type { RenderOptions } from './types';
    const render = (options: RenderOptions) =>
      layout(options.row, options.row, options.row);
  `),
    []
  )
})
