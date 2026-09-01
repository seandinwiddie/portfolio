import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { selectMissionsViewModelAt } from './operationsSelectors'

const owners = Array.from({ length: 6 }, (_, index) => ({
  owner: `operator-${index}`,
  count: 10,
}))

const summary: GithubSummary = {
  profile: {
    login: 'operator',
    name: null,
    bio: null,
    location: null,
    blog: null,
    avatarUrl: 'https://example.com/avatar',
    htmlUrl: 'https://example.com/operator',
    publicRepos: 60,
    followers: 1,
  },
  repos: owners.flatMap(({ owner }) =>
    Array.from({ length: 10 }, (_, index) => ({
      id: `${owner}-${index}`,
      name: `repository-${index}`,
      fullName: `${owner}/repository-${index}`,
      owner,
      description: null,
      language: 'TypeScript',
      stars: 0,
      forks: 0,
      topics: [],
      createdAt: '2026-08-01T00:00:00.000Z',
      htmlUrl: `https://example.com/${owner}/repository-${index}`,
      homepage: null,
      pushedAt: '2026-08-30T00:00:00.000Z',
    }))
  ),
  languages: Array.from({ length: 10 }, (_, index) => ({
    language: `Language ${index}`,
    count: 10 - index,
  })),
  owners,
  since: '2026-08-01T00:00:00.000Z',
  activity: {
    events: [],
    byRepo: Array.from({ length: 10 }, (_, index) => ({
      repo: `operator-0/repository-${index}`,
      count: index + 1,
    })),
    byKind: Array.from({ length: 10 }, (_, index) => ({
      kind: `signal_${index}`,
      count: index + 1,
    })),
    total: 55,
    since: '2026-08-01T00:00:00.000Z',
    until: '2026-08-30T00:00:00.000Z',
  },
  contributions: null,
  cached: true,
  stale: false,
  authenticated: false,
}

const visualization = {
  contributionRamp: ['#0', '#1', '#2', '#3', '#4'] as const,
  axisInk: '#axis',
}

describe('mission operation selectors', () => {
  it('bounds every repeated API collection before projecting the DOM', () => {
    const model = selectMissionsViewModelAt(Date.parse('2026-08-31T00:00:00Z'))(
      TEST_INITIAL_STATE.presentation.missions,
      TEST_INITIAL_STATE.presentation.runtime.signalLattice
    )({ summary, visualization, retainedTransportFailure: false })

    expect(model.data?.activity.kinds).toHaveLength(7)
    expect(model.data?.activity.repos).toHaveLength(7)
    expect(model.data?.languages).toHaveLength(7)
    expect(model.data?.owners).toHaveLength(5)
    expect(model.data?.owners[0].repos).toHaveLength(7)
  })

  it('marks RTK-retained records stale after a transport failure', () => {
    const presentation = TEST_INITIAL_STATE.presentation.missions
    const model = selectMissionsViewModelAt(Date.parse('2026-08-31T00:00:00Z'))(
      presentation,
      TEST_INITIAL_STATE.presentation.runtime.signalLattice
    )({ summary, visualization, retainedTransportFailure: true })

    expect(model.degradedMessage).toBe(
      `${presentation.staleLabel} ${presentation.staleDetail}`
    )
  })
})
