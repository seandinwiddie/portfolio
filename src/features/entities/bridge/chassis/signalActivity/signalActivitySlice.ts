import { createSlice, type CaseReducer } from '@reduxjs/toolkit'
import type {
  SignalActivityId,
  SignalActivityState,
} from '../../../../components/bridge/chassis/signalActivity/signalActivityTypes'

export const initialSignalActivityState: SignalActivityState = {
  activeId: null,
  sequence: 0,
}

const activateSignal =
  (activeId: SignalActivityId): CaseReducer<SignalActivityState> =>
  (state) => {
    state.activeId = activeId
    state.sequence += 1
  }

const signalActivitySlice = createSlice({
  name: 'signalActivity',
  initialState: initialSignalActivityState,
  reducers: {
    querySynchronizationStarted: activateSignal('query-sync'),
    querySynchronizationResolved: activateSignal('query-resolve'),
    routeTransmissionResolved: activateSignal('route-transit'),
    querySynchronizationFailed: activateSignal('query-fault'),
  },
})

export const {
  querySynchronizationStarted,
  querySynchronizationResolved,
  routeTransmissionResolved,
  querySynchronizationFailed,
} = signalActivitySlice.actions

export default signalActivitySlice.reducer
