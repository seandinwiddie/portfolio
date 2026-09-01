import { routeTransmissionResolved } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySlice'
import { selectSignalActivityState } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySelectors'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { setupApiStore } from '../../../../../test/apiStore.test.helper'
import { mockFailedFetch, mockJsonFetch } from '../../../../../test/fetch.test.helper'
import { apiSlice } from '../../../substrate/kernel/api/apiApi'
import { selectSignalActivityCue } from './signalActivitySelectors'

describe('signalActivity listener dataflow', () => {
  afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    jest.restoreAllMocks()
  })

  it('reduces real RTK Query lifecycles and route events before projecting the cue', async () => {
    global.fetch = mockJsonFetch(TEST_INITIAL_STATE)
    const { store } = setupApiStore()
    const initialRequest = store.dispatch(apiSlice.endpoints.getInitialState.initiate())

    await initialRequest
    expect(selectSignalActivityState(store.getState())).toEqual({
      activeId: 'query-resolve',
      sequence: 2,
    })

    global.fetch = mockFailedFetch()
    const failedRefresh = store.dispatch(
      apiSlice.endpoints.getInitialState.initiate(undefined, { forceRefetch: true })
    )
    await failedRefresh
    expect(selectSignalActivityState(store.getState())).toEqual({
      activeId: 'query-fault',
      sequence: 4,
    })

    store.dispatch(routeTransmissionResolved())
    const state = store.getState()
    const world =
      apiSlice.endpoints.getInitialState.select()(state).data?.ambientScene ?? null

    expect(selectSignalActivityState(state)).toEqual({
      activeId: 'route-transit',
      sequence: 5,
    })
    expect(selectSignalActivityCue(world)(selectSignalActivityState(state))?.id).toBe(
      'route-transit'
    )

    initialRequest.unsubscribe()
    failedRefresh.unsubscribe()
    store.dispatch(apiSlice.util.resetApiState())
  })
})
