import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeSelectorMemoization } from './selectorMemoization.mjs'

const context = { projectRoot: process.cwd() }
const analyze = (text) =>
  analyzeSelectorMemoization(context, {
    role: 'selectors',
    rel: 'src/features/entities/example/exampleSelectors.ts',
    filePath: 'src/features/entities/example/exampleSelectors.ts',
    text,
  })

test('proves direct and locally aliased collection derivation from state', () => {
  const direct = analyze(
    'export const selectIds = (state) => state.items.map((item) => item.id);'
  )
  assert.equal(direct.findings.length, 1)
  const aliased = analyze(`
    export const selectIds = (state: RootState) => {
      const items = state.items;
      const ids = items.map((item) => item.id);
      return ids;
    };
  `)
  assert.equal(aliased.findings.length, 1)
})

test('does not correlate state access and collection helpers across functions', () => {
  const analysis = analyze(`
    export const selectItems = (state: RootState) => state.items;
    export const projectIds = (items: readonly Item[]) =>
      items.map((item) => item.id);
  `)
  assert.deepEqual(analysis.findings, [])
  assert.deepEqual(analysis.reviews, [])
})

test('recognizes an aliased imported createSelector memoization boundary', () => {
  const analysis = analyze(`
    import { createSelector as memoizeSelector } from '@reduxjs/toolkit';
    export const selectIds = memoizeSelector(
      [(state: RootState) => state.items],
      (items) => items.map((item) => item.id),
    );
  `)
  assert.deepEqual(analysis.findings, [])
  assert.deepEqual(analysis.reviews, [])
})

test('demotes an unproven selector input to a referenced review', () => {
  const analysis = analyze(
    'export const selectIds = (root) => root.items.map((item) => item.id);'
  )
  assert.deepEqual(analysis.findings, [])
  assert.equal(analysis.reviews.length, 1)
  assert.equal(analysis.reviews[0].level, 'REVIEW')
  assert.match(analysis.reviews[0].skillFile, /SKILL\.md$/)
  assert.match(analysis.reviews[0].reference, /^https:\/\//)
})
