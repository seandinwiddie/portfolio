import type { ThemeCustomState } from './themeCustomSlice'

type ThemeCustomRoot = Readonly<{ themeCustom: ThemeCustomState }>

export type ThemeCustomViewProps = Readonly<{
  loadLabel: string
  onDownload: () => void
  onLoad: () => void
}>

export const selectCustomThemeName = (state: ThemeCustomRoot) =>
  state.themeCustom.customThemeName

export const selectThemeCustomStatus = (state: ThemeCustomRoot) =>
  state.themeCustom.status

export const selectThemeCustomError = (state: ThemeCustomRoot) => state.themeCustom.error

export const selectThemeCustomLoadLabel = (state: ThemeCustomRoot): string =>
  selectCustomThemeName(state) === null ? 'Load Custom Theme' : 'Update Custom Theme'
