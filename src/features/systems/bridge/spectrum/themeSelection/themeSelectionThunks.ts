import { useEffect } from 'react'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../substrate/kernel/composition/compositionThunks'
import {
  applyThemeModeToDocument,
  readStoredBuiltInTheme,
  shippedThemeIds,
} from './themeSelectionAdapters'
import {
  storedThemeRestored,
  themeCatalogLoaded,
  themeSelectionCycled,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSlice'
import {
  selectDocumentThemeMode,
  selectThemeRestorationReady,
  selectSurface,
  selectTamaguiTheme,
  selectThemeToggleViewProps,
  type ThemeSelectionLayoutProps,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'

export const storedThemeRequested =
  () => async (dispatch: ReturnType<typeof useAppDispatch>) => {
    const restored = await readStoredBuiltInTheme()

    dispatch(storedThemeRestored(restored))
  }

export const useThemeSelectionController = (): ThemeSelectionLayoutProps => {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectTamaguiTheme)
  const documentMode = useAppSelector(selectDocumentThemeMode)
  const ready = useAppSelector(selectThemeRestorationReady)
  const surface = useAppSelector(selectSurface)
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ presentation: data?.presentation?.runtime.theme }),
  })
  const toggle = useAppSelector((state) =>
    selectThemeToggleViewProps(state, presentation)
  )

  useEffect(() => {
    dispatch(themeCatalogLoaded(shippedThemeIds()))
    dispatch(storedThemeRequested())
  }, [dispatch])

  useEffect(
    () => applyThemeModeToDocument(documentMode, surface),
    [documentMode, surface]
  )

  return {
    ready,
    mode,
    surface,
    toggle: { ...toggle, onCycle: () => dispatch(themeSelectionCycled()) },
  }
}

export const useThemeToggleController = () => {
  const dispatch = useAppDispatch()
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ presentation: data?.presentation?.runtime.theme }),
  })
  const toggle = useAppSelector((state) =>
    selectThemeToggleViewProps(state, presentation)
  )

  return { ...toggle, onCycle: () => dispatch(themeSelectionCycled()) }
}
