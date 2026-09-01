import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_THEME_ID } from '../../../../../styles/themes/themeProfiles'
import {
  BUILT_IN_THEME_IDS,
  CUSTOM_THEME_ID,
  builtInThemeIdFrom,
  isBuiltInThemeId,
  type BuiltInThemeId,
  type ThemeAppearance,
  type ThemeMode,
} from '../../../../../styles/themes/themeTypes'

export type ThemeSelectionAuthority = 'default' | 'api' | 'stored' | 'visitor'
export type ThemeSelectionStatus = 'idle' | 'ready'
export type ThemeRestorationStatus = 'pending' | 'ready'

export type ThemeSelectionState = Readonly<{
  mode: ThemeMode
  customAppearance: ThemeAppearance
  themes: BuiltInThemeId[]
  status: ThemeSelectionStatus
  restorationStatus: ThemeRestorationStatus
  error: string | null
  authority: ThemeSelectionAuthority
}>

export const initialThemeSelectionState: ThemeSelectionState = {
  mode: DEFAULT_THEME_ID,
  customAppearance: 'dark',
  themes: [...BUILT_IN_THEME_IDS],
  status: 'idle',
  restorationStatus: 'pending',
  error: null,
  authority: 'default',
}

const validatedCatalog = (values: readonly unknown[]): BuiltInThemeId[] =>
  BUILT_IN_THEME_IDS.filter((id) => values.some((value) => value === id))

const nextBuiltInTheme = (
  themes: readonly BuiltInThemeId[],
  mode: ThemeMode
): BuiltInThemeId => {
  const available = themes.length === 0 ? BUILT_IN_THEME_IDS : themes
  const currentIndex = available.findIndex((id) => id === mode)

  return available[(currentIndex + 1) % available.length]
}

const themeSelectionSlice = createSlice({
  name: 'themeSelection',
  initialState: initialThemeSelectionState,
  reducers: {
    themeCatalogLoaded: (state, action: PayloadAction<readonly unknown[]>) => {
      const themes = validatedCatalog(action.payload)

      state.themes = themes.length === 0 ? [...BUILT_IN_THEME_IDS] : themes
      state.status = 'ready'
      state.error = null
    },
    storedThemeRestored: (state, action: PayloadAction<unknown>) => {
      const restored = builtInThemeIdFrom(action.payload)
      const storageMayChoose = state.authority === 'default' || state.authority === 'api'

      state.mode = restored !== null && storageMayChoose ? restored : state.mode
      state.authority = restored !== null && storageMayChoose ? 'stored' : state.authority
      state.restorationStatus = 'ready'
    },
    initialThemeReceived: (state, action: PayloadAction<unknown>) => {
      const initial = builtInThemeIdFrom(action.payload)
      const apiMayChoose = state.authority === 'default' || state.authority === 'api'

      state.mode = initial !== null && apiMayChoose ? initial : state.mode
      state.authority = initial !== null && apiMayChoose ? 'api' : state.authority
    },
    builtInThemeSelected: (state, action: PayloadAction<unknown>) => {
      const selected = builtInThemeIdFrom(action.payload)

      state.mode = selected ?? state.mode
      state.authority = selected === null ? state.authority : 'visitor'
    },
    themeSelectionCycled: (state) => {
      state.mode = nextBuiltInTheme(state.themes, state.mode)
      state.authority = 'visitor'
    },
    customThemeSelected: (state, action: PayloadAction<ThemeAppearance>) => {
      state.mode = CUSTOM_THEME_ID
      state.customAppearance = action.payload
      state.authority = 'visitor'
    },
  },
})

export const {
  builtInThemeSelected,
  customThemeSelected,
  initialThemeReceived,
  storedThemeRestored,
  themeCatalogLoaded,
  themeSelectionCycled,
} = themeSelectionSlice.actions

export const isPersistableThemeMode = (mode: ThemeMode): mode is BuiltInThemeId =>
  isBuiltInThemeId(mode)

export default themeSelectionSlice.reducer
