import { waitFor } from '@testing-library/react-native'
import { routeTransmissionResolved } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySlice'
import { selectSignalActivityState } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySelectors'
import {
  soundPreferenceToggled,
  storedSoundPreferenceRestored,
} from '../../../../entities/bridge/console/soundPreference/soundPreferenceSlice'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { setupApiStore } from '../../../../../test/apiStore.test.helper'
import { mockFailedFetch, mockJsonFetch } from '../../../../../test/fetch.test.helper'
import { apiSlice } from '../../../substrate/kernel/api/apiApi'
import { selectSignalActivityCue } from './signalActivitySelectors'
import { playSignalActivityCue } from './signalActivityAdapters'

jest.mock('./signalActivityAdapters', () => ({
  playSignalActivityCue: jest.fn(() => Promise.resolve()),
}))

const mockedPlaySignalActivityCue = jest.mocked(playSignalActivityCue)

describe('signalActivity listener dataflow', () => {
  afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    jest.restoreAllMocks()
  })

  beforeEach(() => mockedPlaySignalActivityCue.mockClear())

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
    expect(mockedPlaySignalActivityCue).not.toHaveBeenCalled()

    initialRequest.unsubscribe()
    failedRefresh.unsubscribe()
    store.dispatch(apiSlice.util.resetApiState())
  })

  it('retains signal events while gating their audio from the shared preference', async () => {
    global.fetch = mockJsonFetch(TEST_INITIAL_STATE)
    const { store } = setupApiStore()

    store.dispatch(storedSoundPreferenceRestored(true))
    const initialRequest = store.dispatch(apiSlice.endpoints.getInitialState.initiate())
    await initialRequest
    await waitFor(() => expect(mockedPlaySignalActivityCue).toHaveBeenCalled())

    mockedPlaySignalActivityCue.mockClear()
    store.dispatch(soundPreferenceToggled())
    store.dispatch(routeTransmissionResolved())
    await Promise.resolve()

    expect(selectSignalActivityState(store.getState()).activeId).toBe('route-transit')
    expect(mockedPlaySignalActivityCue).not.toHaveBeenCalled()

    store.dispatch(soundPreferenceToggled())
    store.dispatch(routeTransmissionResolved())
    await waitFor(() => expect(mockedPlaySignalActivityCue).toHaveBeenCalledTimes(1))

    initialRequest.unsubscribe()
    store.dispatch(apiSlice.util.resetApiState())
  })
})
