import type {
  AnalyticsSignal,
  DiscoverySignal,
  PublicObservatory,
  PublicPresence,
} from '../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { selectObservatoryViewModel } from './signalArraySelectors'
import { selectObservatoryDelta } from './metrics/metricsAdapters'

const analytics: AnalyticsSignal = {
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
}

const discovery: DiscoverySignal = {
  availability: 'available',
  current: { clicks: 2, impressions: 20, ctr: 0.1, position: 5 },
  previous: { clicks: 1, impressions: 10, ctr: 0.1, position: 10 },
  dateTrend: [
    { date: '2026-08-29', clicks: 1, impressions: 8, ctr: 0.125, position: 7 },
    { date: '2026-08-30', clicks: 1, impressions: 12, ctr: 0.083, position: 5 },
  ],
}

const estatePresence = {
  instrumented: true,
  availability: 'operational',
  httpStatus: 200,
  latencyMs: 42,
  checkedAt: '2026-08-31T20:00:00.000Z',
} as const

const notInstrumented = {
  instrumented: false,
  availability: 'not-instrumented',
} as const

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
      analytics,
      searchConsole: discovery,
    },
  ],
  estates: [
    {
      id: 'forboc',
      label: 'Forboc.ai',
      url: 'https://forboc.ai',
      repositories: [],
      capabilities: {
        presence: estatePresence,
        analytics: notInstrumented,
        searchConsole: notInstrumented,
      },
    },
    {
      id: 'lectures',
      label: 'Lectures',
      url: 'https://seandinwiddie.github.io/lectures/',
      repositories: [
        {
          id: 'seandinwiddie-lectures',
          sourceUrl: 'https://github.com/seandinwiddie/lectures',
          status: 'public-source',
        },
      ],
      capabilities: {
        presence: estatePresence,
        analytics: notInstrumented,
        searchConsole: notInstrumented,
      },
    },
    {
      id: 'functional-programming-library',
      label: 'Functional Programming Library',
      url: 'https://www.npmjs.com/package/functional-programming-composition',
      repositories: [
        {
          id: 'functional-programming-composition-fp',
          sourceUrl: 'https://github.com/functional-programming-composition/fp',
          status: 'public-source',
        },
      ],
      capabilities: {
        presence: { ...estatePresence, availability: 'limited', httpStatus: 403 },
        analytics: notInstrumented,
        searchConsole: notInstrumented,
      },
    },
    {
      id: 'personal',
      label: 'seandinwiddie.com',
      url: 'https://seandinwiddie.com',
      repositories: [],
      capabilities: {
        presence: estatePresence,
        analytics: { instrumented: true, ...analytics },
        searchConsole: { instrumented: true, ...discovery },
      },
    },
    {
      id: 'registry',
      label: 'sdin.dev',
      url: 'https://sdin.dev',
      repositories: [
        {
          id: 'seandinwiddie-portfolio',
          sourceUrl: 'https://github.com/seandinwiddie/portfolio',
          status: 'public-source',
        },
      ],
      capabilities: {
        presence: estatePresence,
        analytics: { instrumented: true, ...analytics },
        searchConsole: { instrumented: true, ...discovery },
      },
    },
    {
      id: 'github-pages',
      label: 'seandinwiddie.github.io',
      url: 'https://seandinwiddie.github.io',
      repositories: [],
      capabilities: {
        presence: estatePresence,
        analytics: notInstrumented,
        searchConsole: notInstrumented,
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
    expect(model.estates).toHaveLength(6)
    expect(model.estates.slice(0, 2).map(({ id }) => id)).toEqual([
      'personal',
      'registry',
    ])
    const registry = model.estates.find(({ id }) => id === 'registry')
    const forboc = model.estates.find(({ id }) => id === 'forboc')
    expect(registry?.analytics.metrics.find(({ id }) => id === 'views')).toMatchObject({
      value: '8',
      delta: '+100.0%',
      tone: 'positive',
    })
    expect(registry?.discovery.metrics.find(({ id }) => id === 'position')).toMatchObject(
      { value: '5.0', delta: '-50.0%', tone: 'positive' }
    )
    expect(registry?.live?.tone).toBe('neutral')
    expect(registry?.window).toBe('Test window · 2026-08-03 — 2026-08-30')
    expect(registry?.analytics.chart.points).toHaveLength(2)
    expect(registry?.analytics.chart.path).toMatch(/^M/u)
    expect(registry?.presence).toMatchObject({
      availability: 'operational',
      state: 'OPERATIONAL',
      checkedAt: '2026-08-31T20:00:00.000Z',
      latency: '42 ms',
      httpStatus: 'HTTP 200',
    })
    expect(registry?.repositories).toEqual([
      {
        id: 'seandinwiddie-portfolio',
        label: 'seandinwiddie-portfolio',
        url: 'https://github.com/seandinwiddie/portfolio',
        status: 'public-source',
        statusLabel: 'PUBLIC SOURCE',
      },
    ])
    expect(forboc?.url).toBe('https://forboc.ai')
    expect(forboc?.repositories).toEqual([])
    expect(forboc?.analytics).toMatchObject({
      availability: 'not-instrumented',
      availabilityLabel: 'NOT INSTRUMENTED',
      metrics: [],
    })
    expect(forboc?.discovery.metrics).toEqual([])
    expect(forboc?.analytics.chart.empty).toBe(true)
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
