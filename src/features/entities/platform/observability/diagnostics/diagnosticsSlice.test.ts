import { diagnosticActionObserved, diagnosticsCleared } from './diagnosticsActions'
import reducer from './diagnosticsSlice'

describe('diagnostics slice', () => {
  it('records serializable actions newest first and clears through events', () => {
    const first = reducer(
      undefined,
      diagnosticActionObserved({ type: 'theme/selected', at: 10 })
    )
    const second = reducer(
      first,
      diagnosticActionObserved({ type: 'experience/cycled', at: 20 })
    )

    expect(second.entries).toEqual([
      { id: 2, type: 'experience/cycled', at: 20 },
      { id: 1, type: 'theme/selected', at: 10 },
    ])
    expect(reducer(second, diagnosticsCleared()).entries).toEqual([])
  })

  it('retains only the latest thirty actions', () => {
    const state = Array.from({ length: 31 }, (_, index) => index).reduce(
      (current, index) =>
        reducer(current, diagnosticActionObserved({ type: `event/${index}`, at: index })),
      reducer(undefined, { type: 'test/initialized' })
    )

    expect(state.entries).toHaveLength(30)
    expect(state.entries[0]).toMatchObject({ id: 31, type: 'event/30' })
    expect(state.entries[29]).toMatchObject({ id: 2, type: 'event/1' })
  })
})
