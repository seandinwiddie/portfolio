import type { GithubSummary } from '../../../../components/platform/foundation/api/apiTypes'
import { selectWelcomeViewModelAt } from './welcomeSelectors'

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
    source: 'graphql',
  },
  cached: false,
  authenticated: true,
}

describe('welcome selectors', () => {
  it('folds indexed contribution weeks and parses the record date', () => {
    const model = selectWelcomeViewModelAt(Date.parse('2026-08-30T00:00:00Z'))(summary)

    expect(model.signalTrace.trace).toBe('█▅')
    expect(model.unitPlate.rows).toContainEqual({
      id: 'incept',
      label: 'incept',
      value: '2023-08-30 · 3 YR RECORD',
    })
  })
})
