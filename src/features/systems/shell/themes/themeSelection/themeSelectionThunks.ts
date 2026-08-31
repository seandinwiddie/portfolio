import { useEffect } from 'react'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../platform/foundation/composition/compositionThunks'
import {
  applyThemeModeToDocument,
  readStoredBuiltInTheme,
  shippedThemeIds,
} from './themeSelectionAdapters'
import {
  storedThemeRestored,
  themeCatalogLoaded,
  themeSelectionCycled,
} from '../../../../entities/shell/themes/themeSelection/themeSelectionSlice'
import {
  selectSurface,
  selectTamaguiTheme,
  selectThemeToggleViewProps,
  type ThemeSelectionLayoutProps,
} from '../../../../entities/shell/themes/themeSelection/themeSelectionSelectors'

export const storedThemeRequested =
  () => async (dispatch: ReturnType<typeof useAppDispatch>) => {
    const restored = await readStoredBuiltInTheme()

    dispatch(storedThemeRestored(restored))
  }

export const useThemeSelectionController = (): ThemeSelectionLayoutProps => {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectTamaguiTheme)
  const surface = useAppSelector(selectSurface)
  const toggle = useAppSelector(selectThemeToggleViewProps)

  useEffect(() => {
    dispatch(themeCatalogLoaded(shippedThemeIds()))
    dispatch(storedThemeRequested())
  }, [dispatch])

  useEffect(() => applyThemeModeToDocument(mode), [mode])

  return {
    mode,
    surface,
    toggle: { ...toggle, onCycle: () => dispatch(themeSelectionCycled()) },
  }
}

export const useThemeToggleController = () => {
  const dispatch = useAppDispatch()
  const toggle = useAppSelector(selectThemeToggleViewProps)

  return { ...toggle, onCycle: () => dispatch(themeSelectionCycled()) }
}
