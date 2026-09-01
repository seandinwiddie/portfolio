import { soundPreferenceToggled } from '../../../../entities/bridge/console/soundPreference/soundPreferenceSlice'
import { selectSoundPreferenceEnabled } from '../../../../entities/bridge/console/soundPreference/soundPreferenceSelectors'
import { startAppListening } from '../../../substrate/kernel/boot/bootListeners'
import { writeBrowserSoundPreference } from './soundPreferenceAdapters'

startAppListening({
  actionCreator: soundPreferenceToggled,
  effect: (_action, { getState }) => {
    writeBrowserSoundPreference(selectSoundPreferenceEnabled(getState()))
  },
})
