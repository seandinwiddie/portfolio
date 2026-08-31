import assert from 'node:assert/strict'
import test from 'node:test'
import { collectSkillAstFindings } from './skillAstChecks.mjs'

const context = {
  projectRoot: process.cwd(),
  lineNumber: (text, offset) => text.slice(0, offset).split(/\r\n|\r|\n/).length,
}

const unitFor = (role, text) => ({
  role,
  rel: `src/features/systems/example/example${role}.ts`,
  filePath: `src/features/systems/example/example${role}.ts`,
  text,
})

const findingsFor = (role, text) => collectSkillAstFindings(context, unitFor(role, text))

test('raw react-redux hooks only build typed hooks through withTypes', () => {
  const valid = [
    "import { useDispatch, useSelector, useStore } from 'react-redux';",
    'export const useAppDispatch = useDispatch.withTypes<AppDispatch>();',
    'export const useAppSelector = useSelector.withTypes<RootState>();',
    'export const useAppStore = useStore.withTypes<AppStore>();',
  ].join('\n')
  assert.deepEqual(findingsFor('thunks', valid), [])
  const invalid = [
    "import { useDispatch, useSelector } from 'react-redux';",
    'const dispatch = useDispatch();',
  ].join('\n')
  const findings = findingsFor('thunks', invalid).join('\n')
  assert.match(findings, /useDispatch is called directly/)
  assert.match(findings, /useSelector must be centralized through useSelector\.withTypes/)
})

test('createSlice reducer keys reject setX and XSet generic setters', () => {
  const findings = findingsFor(
    'slice',
    `
    createSlice({
      name: 'notes',
      initialState,
      reducers: {
        setNote(state, action) { state.note = action.payload },
        noteSet(state, action) { state.note = action.payload },
        noteChanged(state, action) { state.note = action.payload },
      },
    })
  `
  ).join('\n')
  assert.match(findings, /reducer setNote is setter-style/)
  assert.match(findings, /reducer noteSet is setter-style/)
  assert.doesNotMatch(findings, /noteChanged/)
})

test('handwritten switch action type reducers are rejected', () => {
  const findings = findingsFor(
    'reducers',
    `
    export const reduce = (state, action) => {
      switch (action.type) {
        case 'note/changed': return action.payload
        default: return state
      }
    }
  `
  ).join('\n')
  assert.match(findings, /handwritten switch\(action\.type\) reducer is banned/)
})

test('fetching createAsyncThunk payload creators require a condition', () => {
  const missing = findingsFor(
    'thunks',
    `
    export const load = createAsyncThunk(
      'notes/load',
      async () => fetch('/notes'),
    )
  `
  ).join('\n')
  assert.match(missing, /fetches without a thunk-level condition guard/)
  const guarded = findingsFor(
    'thunks',
    `
    export const load = createAsyncThunk(
      'notes/load',
      async () => fetch('/notes'),
      { condition: (_arg, { getState }) => getState().notes.status === 'idle' },
    )
  `
  )
  assert.deepEqual(guarded, [])
  const imperativeSave = findingsFor(
    'thunks',
    `
    export const save = createAsyncThunk('notes/save', async (note) =>
      fetch('/notes', { method: 'POST', body: JSON.stringify(note) }))
  `
  )
  assert.deepEqual(imperativeSave, [])
})

test('thunks may not poll future state with a loop and timer', () => {
  const findings = findingsFor(
    'thunks',
    `
    export const waitForSave = () => async (_dispatch, getState) => {
      while (getState().docs.status !== 'saved') {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  `
  ).join('\n')
  assert.match(findings, /polls future state.*listener middleware/)
})

test('updateQueryData is limited to API endpoint lifecycle handlers', () => {
  assert.match(
    findingsFor(
      'thunks',
      "dispatch(api.util.updateQueryData('posts', undefined, update));"
    ).join('\n'),
    /belongs in an API endpoint lifecycle handler/
  )
  assert.match(
    findingsFor(
      'api',
      "const patch = api.util.updateQueryData('posts', undefined, update);"
    ).join('\n'),
    /belongs in an API endpoint lifecycle handler/
  )
  const lifecycle = findingsFor(
    'api',
    `
    const endpoint = {
      async onQueryStarted(_arg, { dispatch }) {
        dispatch(api.util.updateQueryData('posts', undefined, update))
      },
    }
  `
  )
  assert.deepEqual(lifecycle, [])
})

test('createEntityAdapter identity choice is contextual rather than blocking', () => {
  assert.deepEqual(
    findingsFor('adapters', 'const posts = createEntityAdapter<Post>();'),
    []
  )
  assert.deepEqual(
    findingsFor(
      'adapters',
      'const posts = createEntityAdapter<Post>({ selectId: (post) => post.postId });'
    ),
    []
  )
})

test('selected Redux values cannot be mutated outside reducers', () => {
  const findings = findingsFor(
    'thunks',
    `
    const selected = useAppSelector(selectPost)
    selected.title = 'changed'
    selected.tags.push('new')
    selected.count++
  `
  )
  assert.equal(
    findings.filter((finding) => /is mutated outside a reducer/.test(finding)).length,
    3
  )
  assert.deepEqual(
    findingsFor(
      'thunks',
      `
    const selected = useAppSelector(selectPost)
    const changed = { ...selected, title: 'changed', tags: [...selected.tags, 'new'] }
  `
    ),
    []
  )
})
