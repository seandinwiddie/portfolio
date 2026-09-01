import type { SignalActivityState } from '../../../../components/bridge/chassis/signalActivity/signalActivityTypes'

type SignalActivityRootState = {
  readonly signalActivity: SignalActivityState
}

export const selectSignalActivityState = (
  state: SignalActivityRootState
): SignalActivityState => state.signalActivity
