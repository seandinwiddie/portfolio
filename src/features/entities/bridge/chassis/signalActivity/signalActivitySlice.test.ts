import reducer, {
  initialSignalActivityState,
  querySynchronizationFailed,
  querySynchronizationResolved,
  querySynchronizationStarted,
  routeTransmissionResolved,
} from './signalActivitySlice'

describe('signalActivity slice', () => {
  it('records semantic activity events as a serializable ECS identity and sequence', () => {
    const syncing = reducer(initialSignalActivityState, querySynchronizationStarted())
    const resolved = reducer(syncing, querySynchronizationResolved())
    const routed = reducer(resolved, routeTransmissionResolved())
    const failed = reducer(routed, querySynchronizationFailed())

    expect(syncing).toEqual({ activeId: 'query-sync', sequence: 1 })
    expect(resolved).toEqual({ activeId: 'query-resolve', sequence: 2 })
    expect(routed).toEqual({ activeId: 'route-transit', sequence: 3 })
    expect(failed).toEqual({ activeId: 'query-fault', sequence: 4 })
  })
})
