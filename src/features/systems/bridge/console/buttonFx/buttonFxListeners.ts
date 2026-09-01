import { selectThemeMode } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  buttonFxHovered,
  buttonFxPressed,
} from '../../../../entities/bridge/console/buttonFx/buttonFxActions'
import { selectButtonFxCue } from '../../../../entities/bridge/console/buttonFx/buttonFxSelectors'
import { startAppListening } from '../../../substrate/kernel/boot/bootListeners'
import { playButtonFxCue } from './buttonFxAdapters'

startAppListening({
  actionCreator: buttonFxHovered,
  effect: (action, api): Promise<void> =>
    playButtonFxCue(
      selectButtonFxCue(action.payload.identity)('hover')(selectThemeMode(api.getState()))
    ),
})

startAppListening({
  actionCreator: buttonFxPressed,
  effect: (action, api): Promise<void> =>
    playButtonFxCue(
      selectButtonFxCue(action.payload.identity)('press')(selectThemeMode(api.getState()))
    ),
})
