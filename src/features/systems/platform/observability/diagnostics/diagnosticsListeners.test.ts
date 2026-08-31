import { diagnosticsCleared } from '../../../../entities/platform/observability/diagnostics/diagnosticsActions'
import { selectActionLog } from '../../../../entities/platform/observability/diagnostics/diagnosticsSelectors'
import { makeStore } from '../../../../../store'

describe('action log middleware', () => {
  it('projects dispatched events into Redux-owned serializable diagnostics', () => {
    const store = makeStore({ autoBatch: false })

    store.dispatch({ type: 'portfolio/exampleObserved' })

    expect(selectActionLog(store.getState())[0]).toEqual({
      id: expect.any(Number),
      type: 'portfolio/exampleObserved',
      at: expect.any(Number),
    })

    store.dispatch(diagnosticsCleared())

    expect(selectActionLog(store.getState())).toEqual([])
  })
})
