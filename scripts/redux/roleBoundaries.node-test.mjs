import assert from 'node:assert/strict'
import test from 'node:test'
import { collectViewFindings, collectImportFindings } from './roleBoundaries.mjs'
import { collectBehaviorFindings, collectPurityFindings } from './behaviorChecks.mjs'
import { collectSkillFindings } from './skillChecks.mjs'

/**
 * Minimal source-derived context: no target resolution, so import roles are read
 * from the specifier suffix and view/skill patterns run against raw text.
 * @signature const ctx = object
 */
const ctx = { lineNumber: () => 1, resolveRelativeImport: () => undefined }
const viewUnit = (text) => ({
  role: 'view',
  rel: 'src/views/npc/npcView.tsx',
  filePath: 'src/views/npc/npcView.tsx',
  text,
})
const appUnit = (text) => ({
  role: 'view',
  rel: 'app/index.tsx',
  filePath: 'app/index.tsx',
  text,
  app: true,
  layout: false,
})
const layoutUnit = (text) => ({
  role: 'view',
  rel: 'app/_layout.tsx',
  filePath: 'app/_layout.tsx',
  text,
  app: true,
  layout: true,
})
const sliceUnit = (text) => ({
  role: 'slice',
  rel: 'src/features/entities/x/xSlice.ts',
  filePath: 'x',
  text,
})

test('view may import a selectors role', () => {
  assert.deepEqual(
    collectImportFindings(
      ctx,
      new Map(),
      viewUnit("import type { XView } from '../../features/entities/x/xSelectors';")
    ),
    []
  )
})

test('view importing a types role is flagged (views are only selectors + actions)', () => {
  const findings = collectImportFindings(
    ctx,
    new Map(),
    viewUnit("import type { X } from '../../features/components/x/xTypes';")
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0], /view imports a feature types role/)
})

test('view importing a slice role is flagged', () => {
  const findings = collectImportFindings(
    ctx,
    new Map(),
    viewUnit("import { xActions } from '../../features/entities/x/xSlice';")
  )
  assert.match(findings[0], /view imports a feature slice role/)
})

test('view declaring a type is flagged (views are presentational)', () => {
  const findings = collectViewFindings(
    ctx,
    viewUnit('type Props = { readonly a: string };')
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0], /view declares a type/)
})

test('import type is not a type declaration', () => {
  assert.deepEqual(
    collectViewFindings(
      ctx,
      viewUnit("import type { XView } from '../../features/entities/x/xSelectors';")
    ),
    []
  )
})

test('an app-root view may bind an orchestration thunk hook', () => {
  assert.deepEqual(
    collectImportFindings(
      ctx,
      new Map(),
      appUnit("import { useGame } from '../src/features/systems/game/gameThunks';")
    ),
    []
  )
})

test('a non-app leaf view importing a thunks role is still flagged', () => {
  const findings = collectImportFindings(
    ctx,
    new Map(),
    viewUnit("import { useGame } from '../../features/systems/game/gameThunks';")
  )
  assert.match(findings[0], /view imports a feature thunks role/)
})

test('an app leaf view importing a slice role is still flagged (only thunks are exempt)', () => {
  const findings = collectImportFindings(
    ctx,
    new Map(),
    appUnit("import { xActions } from '../src/features/entities/x/xSlice';")
  )
  assert.match(findings[0], /view imports a feature slice role/)
})

test('the app layout may bind the store Provider', () => {
  assert.deepEqual(
    collectImportFindings(
      ctx,
      new Map(),
      layoutUnit("import { store } from '../src/store';")
    ),
    []
  )
})

test('a non-layout view importing the store is flagged', () => {
  const findings = collectImportFindings(
    ctx,
    new Map(),
    viewUnit("import { store } from '../../store';")
  )
  assert.match(findings[0], /view imports the store/)
})

test('an app view declaring a type is flagged (all tsx are presentational)', () => {
  const findings = collectViewFindings(
    ctx,
    appUnit('type Props = { readonly a: string };')
  )
  assert.match(findings[0], /view declares a type/)
})

test('a selectors role calling a React hook is flagged (pure roles are hook-free)', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'selectors',
    rel: 'src/features/entities/x/xSelectors.ts',
    filePath: 'x',
    text: 'const v = useSelector(selectX);',
  })
  assert.match(findings.join('\n'), /selectors role must not call React hooks/)
})

test('a thunks role may call React hooks (orchestration seam)', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/x/xThunks.ts',
    filePath: 'x',
    text: 'const v = useSelector(selectX);',
  })
  assert.deepEqual(
    findings.filter((f) => /React hooks/.test(f)),
    []
  )
})

test('a types role declaring a hook call is flagged (declarative only)', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'types',
    rel: 'src/features/components/x/xTypes.ts',
    filePath: 'x',
    text: 'const s = useState(0);',
  })
  assert.match(findings.join('\n'), /types role must not call React hooks/)
})

test('a state selector deriving without createSelector is flagged (memoize)', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'selectors',
    rel: 'src/features/entities/x/xSelectors.ts',
    filePath: 'x',
    text: 'export const selectX = (state) => state.x.items.map((i) => i.id);',
  })
  assert.match(
    findings.join('\n'),
    /state selector derives a collection without createSelector/
  )
})

test('a selectors role deriving inside createSelector passes', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'selectors',
    rel: 'src/features/entities/x/xSelectors.ts',
    filePath: 'x',
    text: 'export const selectX = createSelector([selectItems], (items) => items.map((i) => i.id));',
  })
  assert.deepEqual(
    findings.filter((f) => /createSelector/.test(f)),
    []
  )
})

test('a thunks role deriving a view-model data collection is flagged', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/x/xThunks.ts',
    filePath: 'x',
    text: 'const rows = items.map((i) => ({ id: i, taken: has(i) }));',
  })
  assert.match(findings.join('\n'), /thunks role derives a view-model data collection/)
})

test('a count and an action-list are not flagged as data derivation (orchestration)', () => {
  const count = collectBehaviorFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/x/xThunks.ts',
    filePath: 'x',
    text: 'const n = quests.filter((q) => q.active).length;',
  })
  assert.deepEqual(
    count.filter((f) => /data collection/.test(f)),
    []
  )
  const actions = collectBehaviorFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/x/xThunks.ts',
    filePath: 'x',
    text: 'const acts = choices.map((c) => ({ label: c.label, onPress: () => choose(c.next) }));',
  })
  assert.deepEqual(
    actions.filter((f) => /data collection/.test(f)),
    []
  )
})

test('a dispatching useEffect is contextual rather than a blocking purity finding', () => {
  const findings = collectPurityFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/x/xThunks.ts',
    filePath: 'x',
    text: 'useEffect(() => { dispatch(tick()); }, []);',
  })
  assert.deepEqual(findings, [])
})

test('a thunks useEffect that dispatches nowhere in its body is not a listener case', () => {
  const findings = collectPurityFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/x/xThunks.ts',
    filePath: 'x',
    text: 'useEffect(() => { document.title = label; }, [label]); const go = () => dispatch(x());',
  })
  assert.deepEqual(
    findings.filter((f) => /store-reactive useEffect/.test(f)),
    []
  )
})

test('dispatch belongs to thunks listeners and API lifecycles, not action creators', () => {
  const unit = (role) => ({ role, rel: 'x', filePath: 'x', text: 'dispatch(done());' })
  assert.match(
    collectBehaviorFindings(ctx, unit('actions')).join('\n'),
    /actions role must not dispatch/
  )
  ;['thunks', 'listeners', 'api'].forEach((role) => {
    assert.deepEqual(collectBehaviorFindings(ctx, unit(role)), [])
  })
})

test('listener middleware concatenated (not prepended) is flagged', () => {
  const findings = collectSkillFindings(
    ctx,
    sliceUnit(
      'createListenerMiddleware(); configureStore({ middleware: (g) => getDefaultMiddleware().concat(lm.middleware) });'
    )
  )
  assert.match(findings.join('\n'), /listener middleware must be prepended/)
})

test('listener middleware prepended passes', () => {
  assert.deepEqual(
    collectSkillFindings(
      ctx,
      sliceUnit(
        'createListenerMiddleware(); getDefaultMiddleware().prepend(lm.middleware);'
      )
    ),
    []
  )
})

test('a setter-style reducer (setX) is flagged (dispatch events, not setters)', () => {
  assert.match(
    collectSkillFindings(
      ctx,
      sliceUnit('const setNote = (state, action) => { state.note = action.payload; };')
    ).join('\n'),
    /reducer setNote is setter-style/
  )
})

test('an event-style reducer passes', () => {
  assert.deepEqual(
    collectSkillFindings(
      ctx,
      sliceUnit(
        'const noteChanged = (state, action) => { state.note = action.payload; };'
      )
    ),
    []
  )
})

test('blindly spreading action.payload into state is flagged', () => {
  assert.match(
    collectSkillFindings(
      ctx,
      sliceUnit('const loggedIn = (state, action) => ({ ...state, ...action.payload });')
    ).join('\n'),
    /blindly spreads action\.payload/
  )
})

test('local state and context owners are contextual rather than blocking', () => {
  const samples = [
    ['thunks', 'const [started, setStarted] = useState(false);'],
    ['thunks', 'const [active, setActive] = useState<Npc | null>(null);'],
    ['thunks', 'const [state, dispatch] = useReducer(reducer, init);'],
    ['thunks', 'const value = useContext(Context);'],
    ['view', 'const Context = createContext(null);'],
    ['view', 'const [open, setOpen] = useState(false);'],
  ]
  samples.forEach(([role, text]) => {
    assert.deepEqual(
      collectPurityFindings(ctx, { role, rel: 'x', filePath: 'x', text }),
      []
    )
  })
})

test('a UI-animation-timer thunk useState is exempt (design-state-ownership)', () => {
  const findings = collectPurityFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/ticker/tickerThunks.ts',
    filePath: 'x',
    text: 'const [on, setOn] = useState(false); useEffect(() => { const t = setInterval(() => setOn((v) => !v)); return () => clearInterval(t); }, []);',
  })
  assert.deepEqual(
    findings.filter((f) => /useState/.test(f)),
    []
  )
})

test('a pure generation helper (no state access) is not asked to memoize', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'selectors',
    rel: 'src/features/entities/floor/floorSelectors.ts',
    filePath: 'x',
    text: 'export const generateFloor = (id) => rooms.map((r) => r.id);',
  })
  assert.deepEqual(
    findings.filter((f) => /createSelector/.test(f)),
    []
  )
})

test('a UI-timer thunk that never dispatches is not asked to be a listener', () => {
  const findings = collectBehaviorFindings(ctx, {
    role: 'thunks',
    rel: 'src/features/systems/ticker/tickerThunks.ts',
    filePath: 'x',
    text: 'useEffect(() => { const t = setInterval(() => setOn((v) => !v)); return () => clearInterval(t); }, []);',
  })
  assert.deepEqual(
    findings.filter((f) => /reactive useEffect/.test(f)),
    []
  )
})

test('legacy createStore is banned in any role', () => {
  assert.match(
    collectSkillFindings(ctx, sliceUnit('const s = createStore(reducer);'))[0],
    /legacy createStore/
  )
})

test('react-redux connect is banned but a dotted .connect() is not', () => {
  assert.match(
    collectSkillFindings(ctx, sliceUnit('export default connect(mapState)(C);'))[0],
    /connect\(\)/
  )
  assert.deepEqual(collectSkillFindings(ctx, sliceUnit('socket.connect();')), [])
})

test('array middleware and object-form extraReducers are banned', () => {
  assert.match(
    collectSkillFindings(ctx, sliceUnit('configureStore({ middleware: [logger] });'))[0],
    /middleware as an array/
  )
  assert.match(
    collectSkillFindings(
      ctx,
      sliceUnit('createSlice({ extraReducers: { [x]: r } });')
    )[0],
    /object-form extraReducers/
  )
})

test('non-serializable slice state is banned; serializable passes', () => {
  assert.match(
    collectSkillFindings(ctx, sliceUnit('const initialState = { at: new Date() };'))[0],
    /non-serializable/
  )
  assert.deepEqual(
    collectSkillFindings(ctx, sliceUnit("const initialState = { atIso: '2020-01-01' };")),
    []
  )
})
