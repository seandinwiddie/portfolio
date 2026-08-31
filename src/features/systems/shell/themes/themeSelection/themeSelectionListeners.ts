import { apiSlice } from '../../../platform/foundation/api/apiApi'
import { startAppListening } from '../../../platform/foundation/boot/bootListeners'
import { removeCustomThemeStyle } from '../themeCustom/themeCustomAdapters'
import { writeStoredBuiltInTheme } from './themeSelectionAdapters'
import {
  builtInThemeSelected,
  initialThemeReceived,
  isPersistableThemeMode,
  themeSelectionCycled,
} from '../../../../entities/shell/themes/themeSelection/themeSelectionSlice'

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
  effect: async (_action, { getState }) => {
    const mode = getState().themeSelection.mode

    if (!isPersistableThemeMode(mode)) return

    removeCustomThemeStyle()
    await writeStoredBuiltInTheme(mode)
  },
})
