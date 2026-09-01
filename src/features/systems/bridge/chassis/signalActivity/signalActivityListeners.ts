import { isAnyOf } from '@reduxjs/toolkit'
import { fromNullable, match } from 'functional-programming-composition'
import {
  querySynchronizationFailed,
  querySynchronizationResolved,
  querySynchronizationStarted,
  routeTransmissionResolved,
} from '../../../../entities/bridge/chassis/signalActivity/signalActivitySlice'
import { selectSignalActivityState } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySelectors'
import { apiSlice } from '../../../substrate/kernel/api/apiApi'
import { startAppListening } from '../../../substrate/kernel/boot/bootListeners'
import { playSignalActivityCue } from './signalActivityAdapters'
import { selectSignalActivityCue } from './signalActivitySelectors'

const queryPending = isAnyOf(
  apiSlice.endpoints.getInitialState.matchPending,
  apiSlice.endpoints.getGithubSummary.matchPending,
  apiSlice.endpoints.getGithubCommits.matchPending,
  apiSlice.endpoints.getApiStatus.matchPending,
  apiSlice.endpoints.getObservatory.matchPending,
  apiSlice.endpoints.getPresence.matchPending
)

const queryFulfilled = isAnyOf(
  apiSlice.endpoints.getInitialState.matchFulfilled,
  apiSlice.endpoints.getGithubSummary.matchFulfilled,
  apiSlice.endpoints.getGithubCommits.matchFulfilled,
  apiSlice.endpoints.getApiStatus.matchFulfilled,
  apiSlice.endpoints.getObservatory.matchFulfilled,
  apiSlice.endpoints.getPresence.matchFulfilled
)

const queryRejected = isAnyOf(
  apiSlice.endpoints.getInitialState.matchRejected,
  apiSlice.endpoints.getGithubSummary.matchRejected,
  apiSlice.endpoints.getGithubCommits.matchRejected,
  apiSlice.endpoints.getApiStatus.matchRejected,
  apiSlice.endpoints.getObservatory.matchRejected,
  apiSlice.endpoints.getPresence.matchRejected
)

startAppListening({
  matcher: queryPending,
  effect: (_action, api) => {
    api.dispatch(querySynchronizationStarted())
  },
})

startAppListening({
  matcher: queryFulfilled,
  effect: (_action, api) => {
    api.dispatch(querySynchronizationResolved())
  },
})

startAppListening({
  matcher: queryRejected,
  effect: (_action, api) => {
    api.dispatch(querySynchronizationFailed())
  },
})

startAppListening({
  matcher: isAnyOf(
    querySynchronizationStarted,
    querySynchronizationResolved,
    routeTransmissionResolved,
    querySynchronizationFailed
  ),
  effect: (_action, api): Promise<void> => {
    const state = api.getState()
    const world =
      apiSlice.endpoints.getInitialState.select()(state).data?.ambientScene ?? null
    const cue = selectSignalActivityCue(world)(selectSignalActivityState(state))

    return match(fromNullable(cue), playSignalActivityCue, () => Promise.resolve())
  },
})
