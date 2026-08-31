import assert from 'node:assert/strict'
import test from 'node:test'
import { collectDirectFetchFindings } from './directFetchChecks.mjs'

const contextFor = (relative, text) => ({
  projectRoot: process.cwd(),
  sourceFiles: [`/project/${relative}`],
  relativeToProject: (filePath) => filePath.replace('/project/', ''),
  readText: () => text,
})

test('a guarded imperative createAsyncThunk may fetch', () => {
  const context = contextFor(
    'src/features/systems/note/noteThunks.ts',
    `
    export const noteSaved = createAsyncThunk(
      'note/saved',
      async () => fetch('/api/note'),
      { condition: (_arg, { getState }) => getState().note.status === 'idle' },
    )
  `
  )
  assert.deepEqual(collectDirectFetchFindings(context), [])
})

test('an imperative mutation createAsyncThunk may fetch without a dedupe condition', () => {
  const context = contextFor(
    'src/features/systems/note/noteThunks.ts',
    `
    export const noteSaved = createAsyncThunk('note/save', async (note) =>
      fetch('/api/note', { method: 'POST', body: JSON.stringify(note) }))
  `
  )
  assert.deepEqual(collectDirectFetchFindings(context), [])
})

test('unguarded createAsyncThunk and UI fetches remain blocked', () => {
  const unguarded = contextFor(
    'src/features/systems/note/noteThunks.ts',
    "createAsyncThunk('note/saved', async () => fetch('/api/note'))"
  )
  assert.match(collectDirectFetchFindings(unguarded).join('\n'), /thunk-level condition/)
  const view = contextFor('src/views/note/noteView.tsx', "fetch('/api/note')")
  assert.match(
    collectDirectFetchFindings(view).join('\n'),
    /direct fetch is only allowed/
  )
})

test('approved RTK wrapper fetch remains allowed', () => {
  const wrapper = contextFor(
    'src/features/api/endpoints/noteApi.ts',
    "fetch('/api/note')"
  )
  assert.deepEqual(collectDirectFetchFindings(wrapper), [])
})
