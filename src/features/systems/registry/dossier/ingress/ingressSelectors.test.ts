import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { selectIngressViewModelAt } from './ingressSelectors'

const summary: GithubSummary = {
  profile: {
    login: 'sean',
    name: 'Sean',
    bio: null,
    location: 'Earth',
    blog: null,
    avatarUrl: 'https://example.com/avatar.png',
    htmlUrl: 'https://github.com/sean',
    publicRepos: 1,
    followers: 1,
  },
  repos: [],
  languages: [{ language: 'TypeScript', count: 1 }],
  owners: [{ owner: 'sean', count: 1 }],
  since: '2023-08-30T00:00:00Z',
  activity: { events: [], byRepo: [], byKind: [], total: 0, since: null, until: null },
  contributions: {
    days: [
      { date: '2026-08-23', count: 1, level: 1 },
      { date: '2026-08-24', count: 1, level: 1 },
      { date: '2026-08-25', count: 1, level: 1 },
      { date: '2026-08-26', count: 1, level: 1 },
      { date: '2026-08-27', count: 1, level: 1 },
      { date: '2026-08-28', count: 1, level: 1 },
      { date: '2026-08-29', count: 1, level: 1 },
      { date: '2026-08-30', count: 4, level: 4 },
    ],
    total: 11,
    source: 'html',
  },
  cached: false,
  authenticated: true,
}

describe('ingress selectors', () => {
  it('folds indexed contribution weeks and parses the record date', () => {
    const model = selectIngressViewModelAt(Date.parse('2026-08-30T00:00:00Z'))(
      TEST_INITIAL_STATE.presentation.ingress,
      TEST_INITIAL_STATE.presentation.runtime.dossier
    )(summary)

    expect(model.signalTrace.trace).toBe('█▅')
    expect(model.unitPlate.rows).toContainEqual({
      id: 'incept',
      label: 'Test incept',
      value: '2023-08-30 · 3 Test record',
    })
  })
})
