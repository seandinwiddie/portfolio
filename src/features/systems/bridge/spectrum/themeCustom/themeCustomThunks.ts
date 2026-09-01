import { ebind, ematch } from 'functional-programming-composition'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../substrate/kernel/composition/compositionThunks'
import { customThemeSelected } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSlice'
import { selectThemeMode } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  chooseCustomThemeCss,
  downloadActiveTheme,
  installCustomThemeStyle,
} from './themeCustomAdapters'
import {
  selectThemeCustomFeedback,
  selectThemeCustomDownloadLabel,
  selectThemeCustomLoadLabel,
  type ThemeCustomViewProps,
} from '../../../../entities/bridge/spectrum/themeCustom/themeCustomSelectors'
import {
  customThemeExported,
  customThemeExportFailed,
  customThemeExportStarted,
  customThemeImportFailed,
  customThemeImportStarted,
  customThemeLoaded,
} from '../../../../entities/bridge/spectrum/themeCustom/themeCustomSlice'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

export const customThemeFileSelected =
  (fallback: string) => async (dispatch: ReturnType<typeof useAppDispatch>) => {
    dispatch(customThemeImportStarted())

    try {
      const result = ebind(await chooseCustomThemeCss(), installCustomThemeStyle)

      ematch(
        result,
        (message): void => {
          dispatch(customThemeImportFailed(message))
        },
        (appearance): void => {
          dispatch(customThemeLoaded())
          dispatch(customThemeSelected(appearance))
        }
      )
    } catch (error) {
      dispatch(customThemeImportFailed(errorMessage(error, fallback)))
    }
  }

export const customThemeDownloadPressed =
  (mode: ReturnType<typeof selectThemeMode>, fallback: string) =>
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
      dispatch(customThemeExportFailed(errorMessage(error, fallback)))
    }
  }

export const useThemeCustomController = (): ThemeCustomViewProps => {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectThemeMode)
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ presentation: data?.presentation?.runtime.theme }),
  })
  const loadLabel = useAppSelector((state) =>
    selectThemeCustomLoadLabel(state, presentation)
  )
  const feedback = useAppSelector((state) =>
    selectThemeCustomFeedback(state, presentation)
  )
  const failureLabel = presentation?.feedback.failed ?? ''

  return {
    loadLabel,
    downloadLabel: selectThemeCustomDownloadLabel(presentation),
    feedback,
    onDownload: () => dispatch(customThemeDownloadPressed(mode, failureLabel)),
    onLoad: () => dispatch(customThemeFileSelected(failureLabel)),
  }
}
