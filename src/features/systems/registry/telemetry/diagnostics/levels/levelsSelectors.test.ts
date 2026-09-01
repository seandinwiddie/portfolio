import {
  selectApiValue,
  selectGithubValue,
  selectFeedValue,
  selectLegacyApiStatus,
  selectOverallCopy,
  selectTelemetryLevels,
} from './levelsSelectors'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../../test/runtimePresentation.test.data'

const presentation = TEST_RUNTIME_PRESENTATION.telemetry

describe('status level selectors', () => {
  it('routes API, feed, and pending GitHub states without conditional chains', () => {
    const levels = selectTelemetryLevels({
      source: 'network',
      api: { data: { status: 'OK' }, isError: false },
      github: { data: undefined, isFetching: true, isError: false },
    })

    expect(levels).toEqual({
      reachable: true,
      feedLevel: 'nominal',
      apiLevel: 'nominal',
      githubLevel: 'degraded',
    })
    expect(selectApiValue(levels.reachable, 42)(presentation)).toBe('reachable · 42 ms')
    expect(selectFeedValue('error', presentation)).toBe('API data unavailable')
  })

  it('labels retained documents stale after transport failure', () => {
    const input = {
      source: 'stale' as const,
      api: { data: { status: 'OK' as const }, isError: true },
      github: { data: {} as never, isFetching: false, isError: true },
    }
    const levels = selectTelemetryLevels(input)

    expect(levels.feedLevel).toBe('degraded')
    expect(levels.apiLevel).toBe('degraded')
    expect(levels.githubLevel).toBe('degraded')
    expect(selectApiValue(levels.reachable, null)(presentation)).toBe(
      'stale · reconnecting'
    )
    expect(selectGithubValue(input.github, presentation)).toBe('stale · reconnecting')
    expect(selectFeedValue(input.source, presentation)).toBe('stale · reconnecting')
  })

  it('dispatches overall and legacy status copy by state key', () => {
    expect(selectOverallCopy(true, true)(presentation).headline).toBe('Test nominal')
    expect(selectOverallCopy(false, true)(presentation).headline).toBe('Test syncing')
    expect(selectOverallCopy(false, false)(presentation).headline).toBe('Test degraded')
    expect(selectLegacyApiStatus(true, true)(presentation)).toBe('Loading')
    expect(selectLegacyApiStatus(false, true)(presentation)).toBe('Error')
    expect(selectLegacyApiStatus(false, false)(presentation)).toBe('Connected')
  })

  it('treats an uninitialized feed as synchronizing rather than offline', () => {
    const levels = selectTelemetryLevels({
      source: 'pending',
      api: { data: undefined, isError: false },
      github: { data: undefined, isFetching: false, isError: false },
    })

    expect(levels.feedLevel).toBe('degraded')
    expect(selectFeedValue('pending', presentation)).toBe('syncing')
  })
})
