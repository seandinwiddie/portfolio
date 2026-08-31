import {
  selectApiValue,
  selectFeedValue,
  selectLegacyApiStatus,
  selectOverallCopy,
  selectStatusLevels,
} from './levelsSelectors'

describe('status level selectors', () => {
  it('routes API, feed, and pending GitHub states without conditional chains', () => {
    const levels = selectStatusLevels({
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
    expect(selectApiValue(levels.reachable, 42)).toBe('reachable · 42 ms')
    expect(selectFeedValue('error')).toBe('API data unavailable')
  })

  it('dispatches overall and legacy status copy by state key', () => {
    expect(selectOverallCopy(true, true).headline).toBe('All systems nominal.')
    expect(selectOverallCopy(false, true).headline).toBe('Systems synchronizing.')
    expect(selectOverallCopy(false, false).headline).toBe('Running degraded.')
    expect(selectLegacyApiStatus(true, true)).toBe('Loading')
    expect(selectLegacyApiStatus(false, true)).toBe('Error')
    expect(selectLegacyApiStatus(false, false)).toBe('Connected')
  })
})
