import { themeProfiles } from '../../../../../styles/themes/themeProfiles'
import {
  isBuiltInThemeId,
  type ContributionRamp,
  type ThemeMode,
  type ThemeVisualization,
} from '../../../../../styles/themes/themeTypes'
import type { ThemeSelectionState } from './themeSelectionSlice'

type ThemeSelectionRoot = Readonly<{ themeSelection: ThemeSelectionState }>

export type ThemeToggleViewProps = Readonly<{
  label: string
  onCycle: () => void
}>

export type ThemeSelectionLayoutProps = Readonly<{
  mode: ThemeMode
  surface: 'dark' | 'light'
  toggle: ThemeToggleViewProps
}>

const CUSTOM_CONTRIBUTION_RAMP: ContributionRamp = [
  'var(--contribution-step-0)',
  'var(--contribution-step-1)',
  'var(--contribution-step-2)',
  'var(--contribution-step-3)',
  'var(--contribution-step-4)',
]

const CUSTOM_VISUALIZATION: ThemeVisualization = {
  contributionRamp: CUSTOM_CONTRIBUTION_RAMP,
  axisInk: 'var(--visualization-axis-color)',
}

export const selectThemeMode = (state: ThemeSelectionRoot): ThemeMode =>
  state.themeSelection.mode

export const selectThemes = (state: ThemeSelectionRoot) => state.themeSelection.themes

export const selectThemeStatus = (state: ThemeSelectionRoot) =>
  state.themeSelection.status

export const selectThemeLabel = (state: ThemeSelectionRoot): string => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].label : 'Custom'
}

export const selectThemeSource = (state: ThemeSelectionRoot): string | null => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].source.url : null
}

export const selectSurface = (state: ThemeSelectionRoot): 'dark' | 'light' => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].appearance : 'dark'
}

export const selectTamaguiTheme = (state: ThemeSelectionRoot): ThemeMode =>
  selectThemeMode(state)

export const selectContributionVisualization = (
  state: ThemeSelectionRoot
): ThemeVisualization => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].visualization : CUSTOM_VISUALIZATION
}

export const selectThemeToggleViewProps = (
  state: ThemeSelectionRoot
): Omit<ThemeToggleViewProps, 'onCycle'> => ({ label: selectThemeLabel(state) })
