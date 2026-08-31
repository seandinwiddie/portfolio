import assert from 'node:assert/strict'
import test from 'node:test'

import { FP_AST_RULES, collectFpAstFindingsForUnits } from './astConformance.mjs'

const collect = (units) =>
  collectFpAstFindingsForUnits(
    { projectRoot: process.cwd() },
    units.map((unit) => ({ ...unit, filePath: unit.rel }))
  ).filter(({ ruleId }) => ruleId === FP_AST_RULES.coreDependency.id)

test('provable core-to-boundary relative imports BLOCK', () => {
  const [finding] = collect([
    {
      rel: 'src/features/entities/audio/audioSelectors.ts',
      text: "import { play } from '../../systems/audio/audioAdapters'; export const select = play",
    },
    {
      rel: 'src/features/systems/audio/audioAdapters.ts',
      text: 'export const play = () => undefined',
    },
  ])
  assert.equal(finding?.disposition, 'BLOCK')
  assert.equal(finding?.scope, 'core')
  assert.match(finding?.skillRef ?? '', /SKILL\.md:64-65;.*SKILL\.md:297-312/)
  assert.match(finding?.advice ?? '', /Read the complete fp skill/)
})

test('core-to-ambiguous imports REVIEW while core and boundary sources stay valid', () => {
  const [review] = collect([
    {
      rel: 'src/features/entities/map/mapSelectors.ts',
      text: "export { route } from '../../systems/map/mapAdapters'",
    },
    {
      rel: 'src/features/systems/map/mapAdapters.ts',
      text: 'export const route = () => undefined',
    },
  ])
  assert.equal(review?.disposition, 'REVIEW')
  assert.deepEqual(
    collect([
      {
        rel: 'src/features/entities/quest/questSelectors.ts',
        text: "import { fetchTerms } from '../../systems/quest/fetch/fetchAdapters'",
      },
      {
        rel: 'src/features/systems/quest/fetch/fetchAdapters.ts',
        text: 'export const fetchTerms = () => undefined',
      },
      {
        rel: 'src/views/quest/questView.tsx',
        text: "import { fetchTerms } from '../../features/systems/quest/fetch/fetchAdapters'",
      },
    ]),
    []
  )
})
