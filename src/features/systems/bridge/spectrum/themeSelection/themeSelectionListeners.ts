import { apiSlice } from '../../../substrate/kernel/api/apiApi'
import { startAppListening } from '../../../substrate/kernel/boot/bootListeners'
import { customThemeCleared } from '../../../../entities/bridge/spectrum/themeCustom/themeCustomSlice'
import { removeCustomThemeStyle } from '../themeCustom/themeCustomAdapters'
import { writeStoredBuiltInTheme } from './themeSelectionAdapters'
import {
  builtInThemeSelected,
  initialThemeReceived,
  isPersistableThemeMode,
  themeSelectionCycled,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSlice'

startAppListening({
  matcher: apiSlice.endpoints.getInitialState.matchFulfilled,
  effect: ({ payload }, { dispatch }) => {
    dispatch(initialThemeReceived(payload.iniTheme))
  },
})

startAppListening({
  matcher: (
    action
  ): action is
    | ReturnType<typeof builtInThemeSelected>
    | ReturnType<typeof themeSelectionCycled> =>
    builtInThemeSelected.match(action) || themeSelectionCycled.match(action),
  effect: async (_action, { dispatch, getState }) => {
    const mode = getState().themeSelection.mode

    if (!isPersistableThemeMode(mode)) return

    removeCustomThemeStyle()
    dispatch(customThemeCleared())
    await writeStoredBuiltInTheme(mode)
  },
})
