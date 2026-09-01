import { selectThemeMode } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  buttonFxHovered,
  buttonFxPressed,
} from '../../../../entities/bridge/console/buttonFx/buttonFxActions'
import { selectButtonFxCue } from '../../../../entities/bridge/console/buttonFx/buttonFxSelectors'
import type { ButtonFxCue } from '../../../../components/bridge/console/buttonFx/buttonFxTypes'
import { selectSoundPlaybackEnabled } from '../../../../entities/bridge/console/soundPreference/soundPreferenceSelectors'
import { startAppListening } from '../../../substrate/kernel/boot/bootListeners'
import { playButtonFxCue } from './buttonFxAdapters'

const silence = (): Promise<void> => Promise.resolve()

const playWhenEnabled =
  (enabled: boolean) =>
  (cue: ButtonFxCue): Promise<void> =>
    enabled ? playButtonFxCue(cue) : silence()

startAppListening({
  actionCreator: buttonFxHovered,
  effect: (action, api): Promise<void> =>
    playWhenEnabled(selectSoundPlaybackEnabled(api.getState()))(
      selectButtonFxCue(action.payload.identity)('hover')(selectThemeMode(api.getState()))
    ),
})

startAppListening({
  actionCreator: buttonFxPressed,
  effect: (action, api): Promise<void> =>
    playWhenEnabled(selectSoundPlaybackEnabled(api.getState()))(
      selectButtonFxCue(action.payload.identity)('press')(selectThemeMode(api.getState()))
    ),
})
