import type {
  PublicObservatory,
  PublicPresence,
} from '../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { selectObservatoryViewModel } from './signalArraySelectors'
import { selectObservatoryDelta } from './metrics/metricsAdapters'

const observatory: PublicObservatory = {
  checkedAt: '2026-08-31T20:00:00.000Z',
  cached: false,
  stale: false,
  availability: 'available',
  window: {
    current: { startDate: '2026-08-03', endDate: '2026-08-30' },
    previous: { startDate: '2026-07-06', endDate: '2026-08-02' },
  },
  properties: [
    {
      id: 'registry',
      label: 'Registry',
      availability: 'available',
      analytics: {
        availability: 'available',
        realtime: { activeUsers: 0 },
        current: { activeUsers: 2, sessions: 4, views: 8 },
        previous: { activeUsers: 1, sessions: 4, views: 4 },
        trend: {
          activeUsers: { absolute: 1, percent: 100, direction: 'up' },
          sessions: { absolute: 0, percent: 0, direction: 'flat' },
          views: { absolute: 4, percent: 100, direction: 'up' },
        },
        dateTrend: [
          { date: '2026-08-29', activeUsers: 1, sessions: 2, views: 3 },
          { date: '2026-08-30', activeUsers: 2, sessions: 4, views: 8 },
        ],
      },
      searchConsole: {
        availability: 'available',
        current: { clicks: 2, impressions: 20, ctr: 0.1, position: 5 },
        previous: { clicks: 1, impressions: 10, ctr: 0.1, position: 10 },
        dateTrend: [
          { date: '2026-08-29', clicks: 1, impressions: 8, ctr: 0.125, position: 7 },
          { date: '2026-08-30', clicks: 1, impressions: 12, ctr: 0.083, position: 5 },
        ],
      },
    },
  ],
}

const presence: PublicPresence = {
  checkedAt: '2026-08-31T20:00:00.000Z',
  cached: false,
  stale: false,
  summary: { channels: 1, operational: 1, limited: 0, unreachable: 0 },
  channels: [
    {
      id: 'registry',
      label: 'Registry',
      url: 'https://example.com',
      state: 'operational',
      httpStatus: 200,
      latencyMs: 42,
      checkedAt: '2026-08-31T20:00:00.000Z',
    },
  ],
}

const github: GithubSummary = {
  profile: {
    login: 'operator',
    name: null,
    bio: null,
    location: null,
    blog: null,
    avatarUrl: 'https://example.com/avatar',
    htmlUrl: 'https://example.com/operator',
    publicRepos: 3,
    followers: 2,
  },
  repos: [],
  languages: [],
  owners: [],
  since: null,
  activity: { events: [], byRepo: [], byKind: [], total: 0, since: null, until: null },
  contributions: null,
  cached: false,
  authenticated: false,
}

describe('observatory selectors', () => {
  it('projects honest period deltas, bounded traces, and unavailable contributions', () => {
    const model = selectObservatoryViewModel({
      presentation: TEST_INITIAL_STATE.presentation.observatory,
      dataStatus: { pendingLabel: null, errorLabel: null },
      observatory,
      observatoryPending: false,
      observatoryError: false,
      presence,
      presencePending: false,
      presenceError: false,
      github,
      githubPending: false,
      githubError: false,
      visualization: {
        contributionRamp: ['#0', '#1', '#2', '#3', '#4'],
        axisInk: '#axis',
      },
    })

    expect(model.impact.map(({ id }) => id)).toEqual(['followers', 'repositories'])
    expect(model.properties[0].analytics.find(({ id }) => id === 'views')).toMatchObject({
      value: '8',
      delta: '+100.0%',
      tone: 'positive',
    })
    expect(
      model.properties[0].discovery.find(({ id }) => id === 'position')
    ).toMatchObject({ value: '5.0', delta: '-50.0%', tone: 'positive' })
    expect(model.properties[0].live?.tone).toBe('neutral')
    expect(model.properties[0].analyticsChart.points).toHaveLength(2)
    expect(model.properties[0].analyticsChart.path).toMatch(/^M/u)
    expect(model.presence[0]).toMatchObject({ state: 'OPERATIONAL', latency: '42 ms' })
  })

  it('does not manufacture a percentage when the prior baseline is zero', () => {
    expect(selectObservatoryDelta(3, 0)).toEqual({
      absolute: 3,
      percent: null,
      direction: 'up',
    })
  })

  it('keeps independent feed failures explicit', () => {
    const model = selectObservatoryViewModel({
      presentation: TEST_INITIAL_STATE.presentation.observatory,
      dataStatus: { pendingLabel: null, errorLabel: null },
      observatory: undefined,
      observatoryPending: false,
      observatoryError: true,
      presence: undefined,
      presencePending: false,
      presenceError: true,
      github: undefined,
      githubPending: true,
      githubError: false,
      visualization: {
        contributionRamp: ['#0', '#1', '#2', '#3', '#4'],
        axisInk: '#axis',
      },
    })

    expect(model.feedTone).toBe('negative')
    expect(model.presenceState).toBe(
      TEST_INITIAL_STATE.presentation.observatory.unavailableLabel
    )
    expect(model.impactState).toBe(TEST_INITIAL_STATE.presentation.observatory.syncLabel)
  })

  it('labels preserved observatory and presence snapshots as stale', () => {
    const model = selectObservatoryViewModel({
      presentation: TEST_INITIAL_STATE.presentation.observatory,
      dataStatus: { pendingLabel: null, errorLabel: null },
      observatory: { ...observatory, cached: true, stale: true },
      observatoryPending: false,
      observatoryError: false,
      presence: { ...presence, cached: true, stale: true },
      presencePending: false,
      presenceError: false,
      github: { ...github, stale: true },
      githubPending: false,
      githubError: false,
      visualization: {
        contributionRamp: ['#0', '#1', '#2', '#3', '#4'],
        axisInk: '#axis',
      },
    })

    expect(model.feedLabel).toBe(TEST_INITIAL_STATE.presentation.observatory.staleLabel)
    expect(model.presenceState).toBe(
      TEST_INITIAL_STATE.presentation.observatory.staleLabel
    )
    expect(model.impactState).toBe(TEST_INITIAL_STATE.presentation.observatory.staleLabel)
  })

  it('labels RTK-retained snapshots as stale when a refetch transport fails', () => {
    const model = selectObservatoryViewModel({
      presentation: TEST_INITIAL_STATE.presentation.observatory,
      dataStatus: { pendingLabel: null, errorLabel: null },
      observatory,
      observatoryPending: false,
      observatoryError: true,
      presence,
      presencePending: false,
      presenceError: true,
      github,
      githubPending: false,
      githubError: true,
      visualization: {
        contributionRamp: ['#0', '#1', '#2', '#3', '#4'],
        axisInk: '#axis',
      },
    })

    expect(model.feedLabel).toBe(TEST_INITIAL_STATE.presentation.observatory.staleLabel)
    expect(model.feedTone).toBe('degraded')
    expect(model.presence).toHaveLength(1)
    expect(model.presenceState).toBe(
      TEST_INITIAL_STATE.presentation.observatory.staleLabel
    )
    expect(model.impact).toHaveLength(2)
    expect(model.impactState).toBe(TEST_INITIAL_STATE.presentation.observatory.staleLabel)
  })
})
