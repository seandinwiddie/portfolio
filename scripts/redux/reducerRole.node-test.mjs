import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { collectBehaviorFindings } from './behaviorChecks.mjs'
import { createProjectContext } from './projectContext.mjs'
import { checkRoleBoundaries, collectImportFindings } from './roleBoundaries.mjs'
import { collectRoleNameFindings } from './roleNames.mjs'
import { roleForSpecifier } from './roleRules.mjs'

const contextStub = { lineNumber: () => 1, resolveRelativeImport: () => undefined }

test('Reducer and Reducers leaves and import specifiers are recognized as reducers', () => {
  assert.equal(
    roleForSpecifier('src/features/systems/gameplay/gameplayReducer.ts'),
    'reducers'
  )
  assert.equal(roleForSpecifier('../gameplay/gameplayReducers'), 'reducers')
  ;['native', 'web', 'ios', 'android'].forEach((platform) => {
    assert.equal(
      roleForSpecifier(`src/features/systems/gameplay/gameplayReducers.${platform}.ts`),
      'reducers'
    )
  })
})

test('project source-file recognition delegates Reducer and Reducers leaves to the reducers role', (t) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-redux-role-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  const domainRoot = path.join(projectRoot, 'src', 'features', 'systems', 'gameplay')
  mkdirSync(domainRoot, { recursive: true })
  const singular = path.join(domainRoot, 'gameplayReducer.ts')
  const plural = path.join(domainRoot, 'gameplayReducers.ts')
  writeFileSync(singular, 'export const reduceOne = (state) => state;\n')
  writeFileSync(plural, 'export const reduceMany = (state) => state;\n')
  const context = createProjectContext(projectRoot)
  assert.equal(context.roleForFile(singular), 'reducers')
  assert.equal(context.roleForFile(plural), 'reducers')
})

test('a bare Reducers source leaf is rejected as not domain-qualified', (t) => {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'therapy-redux-bare-role-'))
  t.after(() => rmSync(projectRoot, { recursive: true, force: true }))
  const domainRoot = path.join(projectRoot, 'src', 'features', 'systems', 'gameplay')
  mkdirSync(domainRoot, { recursive: true })
  writeFileSync(
    path.join(domainRoot, 'Reducers.ts'),
    'export const reduce = (state) => state;\n'
  )
  const failures = []
  checkRoleBoundaries(createProjectContext(projectRoot), (_summary, findings) =>
    failures.push(...findings)
  )
  assert.match(
    failures.join('\n'),
    /role source leaf must be domain-qualified, not a bare reducers role/
  )
})

test('a reducers role uses the immediate-domain plural Reducers name', () => {
  const context = {
    projectRoot: '/project',
    relativeToProject: (filePath) => filePath.replace('/project/', ''),
  }
  const canonical = {
    role: 'reducers',
    filePath: '/project/src/features/systems/gameplay/gameplayReducers.native.ts',
  }
  ;['native', 'web', 'ios', 'android'].forEach((platform) => {
    assert.deepEqual(
      collectRoleNameFindings(context, [
        {
          ...canonical,
          filePath: `/project/src/features/systems/gameplay/gameplayReducers.${platform}.ts`,
        },
      ]),
      []
    )
  })
  assert.match(
    collectRoleNameFindings(context, [
      {
        ...canonical,
        filePath: '/project/src/features/systems/gameplay/gameplayRootReducers.ts',
      },
    ]).join('\n'),
    /must be gameplayReducers/
  )
})

test('reducers may import pure boundary dependencies', () => {
  const unit = {
    role: 'reducers',
    rel: 'src/features/systems/gameplay/gameplayReducers.ts',
    filePath: 'gameplayReducers.ts',
    text: [
      "import { gameplayActions } from './gameplayActions';",
      "import { adaptCommit } from './gameplayAdapters';",
      "import { selectTurn } from './gameplaySelectors';",
      "import { gameplaySlice } from './gameplaySlice';",
      "import type { Commit } from './gameplayTypes';",
    ].join('\n'),
  }
  assert.deepEqual(collectImportFindings(contextStub, new Map(), unit), [])
})

test('reducers must not import listeners, thunks, APIs, or views', () => {
  const unit = {
    role: 'reducers',
    rel: 'src/features/systems/gameplay/gameplayReducers.ts',
    filePath: 'gameplayReducers.ts',
    text: [
      "import './gameplayListeners';",
      "import { run } from './gameplayThunks';",
      "import { api } from './gameplayApi';",
      "import { GameplayView } from '../../../views/gameplay/gameplayView';",
    ].join('\n'),
  }
  const findings = collectImportFindings(contextStub, new Map(), unit).join('\n')
  assert.match(findings, /reducers must not import listeners/)
  assert.match(findings, /reducers must not import thunks/)
  assert.match(findings, /reducers must not import api/)
  assert.match(findings, /feature imports views/)
  assert.match(findings, /reducers must not import view/)
})

test('reducers are pure and cannot dispatch, read state, call hooks, or perform IO', () => {
  const findings = collectBehaviorFindings(contextStub, {
    role: 'reducers',
    rel: 'src/features/systems/gameplay/gameplayReducers.ts',
    filePath: 'gameplayReducers.ts',
    text: 'dispatch(done()); getState(); useSelector(selectX); fetch(url);',
  }).join('\n')
  assert.match(findings, /reducers role must not dispatch/)
  assert.match(findings, /reducers role must not call getState/)
  assert.match(findings, /reducers role must not call React hooks/)
  assert.match(findings, /pure reducers role fetches data/)
})
