import { ebind, ematch } from 'functional-programming-composition'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../platform/foundation/composition/compositionThunks'
import { customThemeSelected } from '../../../../entities/shell/themes/themeSelection/themeSelectionSlice'
import { selectThemeMode } from '../../../../entities/shell/themes/themeSelection/themeSelectionSelectors'
import {
  chooseCustomThemeCss,
  downloadActiveTheme,
  installCustomThemeStyle,
} from './themeCustomAdapters'
import {
  selectThemeCustomLoadLabel,
  type ThemeCustomViewProps,
} from '../../../../entities/shell/themes/themeCustom/themeCustomSelectors'
import {
  customThemeExported,
  customThemeExportFailed,
  customThemeExportStarted,
  customThemeImportFailed,
  customThemeImportStarted,
  customThemeLoaded,
} from '../../../../entities/shell/themes/themeCustom/themeCustomSlice'

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Custom theme operation failed'

export const customThemeFileSelected =
  () => async (dispatch: ReturnType<typeof useAppDispatch>) => {
    dispatch(customThemeImportStarted())

    try {
      const result = ebind(await chooseCustomThemeCss(), installCustomThemeStyle)

      ematch(
        result,
        (message): void => {
          dispatch(customThemeImportFailed(message))
        },
        (): void => {
          dispatch(customThemeLoaded())
          dispatch(customThemeSelected())
        }
      )
    } catch (error) {
      dispatch(customThemeImportFailed(errorMessage(error)))
    }
  }

export const customThemeDownloadPressed =
  (mode: ReturnType<typeof selectThemeMode>) =>
  (dispatch: ReturnType<typeof useAppDispatch>): void => {
    dispatch(customThemeExportStarted())

    try {
      ematch(
        downloadActiveTheme(mode),
        (message): void => {
          dispatch(customThemeExportFailed(message))
        },
        (): void => {
          dispatch(customThemeExported())
        }
      )
    } catch (error) {
      dispatch(customThemeExportFailed(errorMessage(error)))
    }
  }

export const useThemeCustomController = (): ThemeCustomViewProps => {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectThemeMode)
  const loadLabel = useAppSelector(selectThemeCustomLoadLabel)

  return {
    loadLabel,
    onDownload: () => dispatch(customThemeDownloadPressed(mode)),
    onLoad: () => dispatch(customThemeFileSelected()),
  }
}
