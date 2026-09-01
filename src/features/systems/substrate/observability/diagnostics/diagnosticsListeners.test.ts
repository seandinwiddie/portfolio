import { diagnosticsCleared } from '../../../../entities/substrate/observability/diagnostics/diagnosticsActions'
import { selectActionLog } from '../../../../entities/substrate/observability/diagnostics/diagnosticsSelectors'
import { makeStore } from '../../../../../store'

describe('action log middleware', () => {
  it('projects dispatched events into Redux-owned serializable diagnostics', () => {
    const store = makeStore({ autoBatch: false })

    store.dispatch({ type: 'registry/exampleObserved' })

    expect(selectActionLog(store.getState())[0]).toEqual({
      id: expect.any(Number),
      type: 'registry/exampleObserved',
      at: expect.any(Number),
    })

    store.dispatch(diagnosticsCleared())

    expect(selectActionLog(store.getState())).toEqual([])
  })
})
