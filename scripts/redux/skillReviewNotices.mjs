import { collectContextualSkillSmells } from './contextualSkillSmells.mjs'
import { collectApiCompositionSmells } from './apiComposition.mjs'
import { collectListenerOrderSmells } from './listenerAuthority.mjs'
import { skillDirectoryOf } from '../skill-paths.mjs'

const skillPath = (directory) => skillDirectoryOf(directory)
const localReferenceBySkill = {
  'build-modern-redux-apps/modern-redux': `${skillPath('build-modern-redux-apps-modern-redux')}/references/store-lifetime.md`,
  'manage-server-data/adopt-rtk-query': `${skillPath('manage-server-data-adopt-rtk-query')}/references/endpoint-lifecycle.md`,
  'manage-server-data/generate-rtk-query-from-openapi': `${skillPath('manage-server-data-generate-rtk-query-from-openapi')}/references/codegen-overrides.md`,
  'model-redux-state/build-slices-and-selectors': `${skillPath('model-redux-state-build-slices-and-selectors')}/references/slice-patterns.md`,
  'model-redux-state/design-state-ownership': `${skillPath('model-redux-state-design-state-ownership')}/references/state-ownership.md`,
  'orchestrate-side-effects/handle-side-effects': `${skillPath('orchestrate-side-effects-handle-side-effects')}/references/listener-workflows.md`,
}

const reviewContracts = [
  {
    skill: 'build-modern-redux-apps/modern-redux',
    skillFile: `${skillPath('build-modern-redux-apps-modern-redux')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/usage/nextjs',
    guidance:
      'Review framework boundaries and SSR store lifetime: per-request creation and render-stable Provider ownership are contextual.',
  },
  {
    skill: 'build-modern-redux-apps/redux-dataflow',
    skillFile: `${skillPath('build-modern-redux-apps-redux-dataflow')}/SKILL.md`,
    reference: 'https://redux.js.org/style-guide/',
    guidance:
      'Review whether actions describe domain events and reducers—not callers—own combinations of current state with incoming data.',
  },
  {
    skill: 'evolve-and-diagnose-redux-apps/debug-redux-toolkit-apps',
    skillFile: `${skillPath('evolve-and-diagnose-redux-apps-debug-redux-toolkit-apps')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/rtk-query/usage/automated-refetching',
    guidance:
      'Review subscription breadth, selector reference stability, and cache invalidation semantics, including whether a query is actively subscribed.',
  },
  {
    skill: 'evolve-and-diagnose-redux-apps/migrate-to-modern-redux',
    skillFile: `${skillPath('evolve-and-diagnose-redux-apps-migrate-to-modern-redux')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/usage/migrating-to-modern-redux',
    guidance:
      'Review migration sequencing: modernize touched reducers and integrations incrementally without extending a legacy server-data stack.',
  },
  {
    skill: 'manage-server-data/adopt-rtk-query',
    skillFile: `${skillPath('manage-server-data-adopt-rtk-query')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/rtk-query/usage/cache-behavior',
    guidance:
      'Review RTK Query fit: it is a document cache, not a normalized graph cache; verify tag specificity and intended subscribed-query invalidation behavior.',
  },
  {
    skill: 'manage-server-data/generate-rtk-query-from-openapi',
    skillFile: `${skillPath('manage-server-data-generate-rtk-query-from-openapi')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/rtk-query/usage/code-generation',
    guidance:
      'Review generated endpoints as source: narrow generation where useful and validate endpointOverrides, parameter shapes, operation kinds, and tag specificity.',
  },
  {
    skill: 'model-redux-state/build-slices-and-selectors',
    skillFile: `${skillPath('model-redux-state-build-slices-and-selectors')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/api/createSlice',
    guidance:
      'Review selector placement, selector factories for parameterized multi-instance use, memoization boundaries, and whether entity adapters fit the owned collection.',
  },
  {
    skill: 'model-redux-state/design-state-ownership',
    skillFile: `${skillPath('model-redux-state-design-state-ownership')}/SKILL.md`,
    reference:
      'https://redux.js.org/style-guide/#evaluate-where-each-piece-of-state-should-live',
    guidance:
      'Review ownership of local form state, router/URL state, external caches, and Redux state; resize slices when real access patterns change.',
  },
  {
    skill: 'orchestrate-side-effects/handle-side-effects',
    skillFile: `${skillPath('orchestrate-side-effects-handle-side-effects')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/api/createListenerMiddleware',
    guidance:
      'Review the side-effect boundary choice among RTK Query, thunks, and listeners; verify listener cancellation, debounce, and concurrency semantics where relevant.',
  },
]

const sourceContains = (context, pattern) =>
  context.sourceFiles.some((filePath) => pattern.test(context.readText(filePath)))

const smellContracts = [
  {
    applies: (context) =>
      sourceContains(context, /\bcreateAsyncThunk\s*(?:<|\()/) &&
      sourceContains(context, /\bfetch\s*\(/),
    skill: 'manage-server-data/adopt-rtk-query',
    skillFile: `${skillPath('manage-server-data-adopt-rtk-query')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/rtk-query/overview',
    guidance:
      'Fetching thunks exist; review whether any represent reusable server documents that belong in RTK Query.',
  },
  {
    applies: (context) => sourceContains(context, /\bstartListening\s*\(/),
    skill: 'orchestrate-side-effects/handle-side-effects',
    skillFile: `${skillPath('orchestrate-side-effects-handle-side-effects')}/SKILL.md`,
    reference:
      'https://redux-toolkit.js.org/api/createListenerMiddleware#listener-subscription-management',
    guidance:
      'Listener workflows exist; review cancellation, debounce, fork/task lifetime, and duplicate-listener behavior.',
  },
]

export const collectSkillReviewNotices = (context) => [
  ...reviewContracts.map((contract) => ({ level: 'REVIEW', ...contract })),
  ...smellContracts
    .filter(({ applies }) => applies(context))
    .map(({ applies: _applies, ...contract }) => ({ level: 'SMELL', ...contract })),
  ...collectContextualSkillSmells(context),
  ...collectListenerOrderSmells(context),
  ...collectApiCompositionSmells(context).map((guidance) => ({
    level: 'SMELL',
    skill: 'manage-server-data/adopt-rtk-query',
    skillFile: `${skillPath('manage-server-data-adopt-rtk-query')}/SKILL.md`,
    reference: 'https://redux-toolkit.js.org/rtk-query/api/createApi',
    guidance,
  })),
]

export const formatSkillReviewNotice = (notice) => [
  `[${notice.level}] ${notice.guidance}`,
  `  Skill: ${notice.skillFile}`,
  ...(localReferenceBySkill[notice.skill]
    ? [`  Local reference: ${localReferenceBySkill[notice.skill]}`]
    : []),
  ...(notice.relatedSkills ?? []).flatMap((related) => [
    `  Related skill: ${related.skillFile}`,
    ...(localReferenceBySkill[related.skill]
      ? [`  Related local reference: ${localReferenceBySkill[related.skill]}`]
      : []),
  ]),
  `  Reference: ${notice.reference}`,
  `  Guidance: Read ${[
    notice.skill,
    ...(notice.relatedSkills ?? []).map(({ skill }) => skill),
  ].join(' and ')} for the contextual decision process.`,
]
