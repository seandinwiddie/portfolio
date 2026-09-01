import { selectFeedLabel, selectTelemetryViewModel } from './telemetrySelectors'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'

describe('bridge telemetry selectors', () => {
  it('keeps the persistent rail limited to functional feed and theme readouts', () => {
    const model = selectTelemetryViewModel('Ruby Crystal', {
      hasData: true,
      isPartial: false,
      isStale: false,
      isFetching: false,
      isError: false,
    })(TEST_RUNTIME_PRESENTATION.telemetry)

    expect(Object.keys(model)).toEqual(['feed', 'theme'])
    expect(JSON.stringify(model)).not.toMatch(/fx|cinematic/i)
  })

  it('distinguishes a retained snapshot from a hard outage', () => {
    const selectLabel = selectFeedLabel(TEST_RUNTIME_PRESENTATION.telemetry)

    expect(
      selectLabel({
        hasData: true,
        isPartial: false,
        isStale: false,
        isFetching: false,
        isError: true,
      })
    ).toBe('STALE')
    expect(
      selectLabel({
        hasData: false,
        isPartial: false,
        isStale: false,
        isFetching: false,
        isError: true,
      })
    ).toBe('OFFLINE')
  })

  it('honors successful stale and partial API provenance before live transport', () => {
    const selectLabel = selectFeedLabel(TEST_RUNTIME_PRESENTATION.telemetry)

    expect(
      selectLabel({
        hasData: true,
        isPartial: false,
        isStale: true,
        isFetching: false,
        isError: false,
      })
    ).toBe('STALE')
    expect(
      selectLabel({
        hasData: true,
        isPartial: true,
        isStale: false,
        isFetching: false,
        isError: false,
      })
    ).toBe('Test degraded')
  })
})
