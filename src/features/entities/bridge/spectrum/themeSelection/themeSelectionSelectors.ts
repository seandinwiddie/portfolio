import { createSelector } from '@reduxjs/toolkit'
import type { ThemeBootViewModel } from '../../../../components/bridge/spectrum/themeSelection/themeSelectionTypes'
import { THEME_STORAGE_KEY } from '../../../../components/bridge/spectrum/themeSelection/themeSelectionTypes'
import {
  DEFAULT_THEME_ID,
  themeProfiles,
} from '../../../../../styles/themes/themeProfiles'
import {
  BUILT_IN_THEME_IDS,
  builtInThemeIdFrom,
  isBuiltInThemeId,
  type BuiltInThemeId,
  type ContributionRamp,
  type ThemeMode,
  type ThemeVisualization,
} from '../../../../../styles/themes/themeTypes'
import type { ThemeSelectionState } from './themeSelectionSlice'

type ThemeSelectionRoot = Readonly<{ themeSelection: ThemeSelectionState }>

export type ThemeToggleViewProps = Readonly<{
  prefixLabel: string
  label: string
  onCycle: () => void
}>

export type ThemeSelectionLayoutProps = Readonly<{
  ready: boolean
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

const bootClassFor = (id: BuiltInThemeId): string => `theme-${id}`

const bootRuleFor = (id: BuiltInThemeId): string => {
  const profile = themeProfiles[id]
  return `html.${bootClassFor(id)}, html.${bootClassFor(id)} body {
  background-color: ${profile.roles.background};
  color: ${profile.roles.foreground};
  color-scheme: ${profile.appearance};
}`
}

const BOOT_CLASS_BY_THEME = Object.fromEntries(
  BUILT_IN_THEME_IDS.map((id) => [id, bootClassFor(id)])
) as Readonly<Record<BuiltInThemeId, string>>
const BOOT_THEME_CLASSES = BUILT_IN_THEME_IDS.map(bootClassFor)
const DEFAULT_BOOT_CLASS = BOOT_CLASS_BY_THEME[DEFAULT_THEME_ID]
const BOOT_STYLESHEET = [
  `html, body {
  background-color: ${themeProfiles[DEFAULT_THEME_ID].roles.background};
  color: ${themeProfiles[DEFAULT_THEME_ID].roles.foreground};
  color-scheme: ${themeProfiles[DEFAULT_THEME_ID].appearance};
}`,
  ...BUILT_IN_THEME_IDS.map(bootRuleFor),
].join('\n')
const BOOT_SCRIPT = `(function () {
  var root = window["doc" + "ument"]["documentElement"];
  var classes = ${JSON.stringify(BOOT_THEME_CLASSES)};
  var classByTheme = ${JSON.stringify(BOOT_CLASS_BY_THEME)};
  var apply = function (theme) {
    var requested = classByTheme[theme];
    var selected = classes.indexOf(requested) >= 0 ? requested : classByTheme[${JSON.stringify(
      DEFAULT_THEME_ID
    )}];
    root["classList"]["remove"].apply(root["classList"], classes);
    root["classList"]["add"](selected);
  };
  try {
    apply(window["local" + "Storage"].getItem(${JSON.stringify(THEME_STORAGE_KEY)}));
  } catch (_error) {
    apply(${JSON.stringify(DEFAULT_THEME_ID)});
  }
})();`
const THEME_BOOT_VIEW_MODEL: ThemeBootViewModel = {
  defaultClassName: DEFAULT_BOOT_CLASS,
  stylesheet: BOOT_STYLESHEET,
  script: BOOT_SCRIPT,
}

export const selectThemeBootClass = (stored: unknown): string =>
  BOOT_CLASS_BY_THEME[builtInThemeIdFrom(stored) ?? DEFAULT_THEME_ID]

export const selectThemeBootViewModel = (): ThemeBootViewModel => THEME_BOOT_VIEW_MODEL

export const selectThemeMode = (state: ThemeSelectionRoot): ThemeMode =>
  state.themeSelection.mode

export const selectThemes = (state: ThemeSelectionRoot) => state.themeSelection.themes

export const selectThemeStatus = (state: ThemeSelectionRoot) =>
  state.themeSelection.status

export const selectThemeRestorationReady = (state: ThemeSelectionRoot): boolean =>
  state.themeSelection.restorationStatus === 'ready'

export const selectDocumentThemeMode = (state: ThemeSelectionRoot): ThemeMode | null =>
  selectThemeRestorationReady(state) ? state.themeSelection.mode : null

export const selectThemeLabel = (state: ThemeSelectionRoot, customLabel = ''): string => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].label : customLabel
}

export const selectThemeSource = (state: ThemeSelectionRoot): string | null => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].source.url : null
}

export const selectSurface = (state: ThemeSelectionRoot): 'dark' | 'light' => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode)
    ? themeProfiles[mode].appearance
    : state.themeSelection.customAppearance
}

export const selectTamaguiTheme = (state: ThemeSelectionRoot): ThemeMode =>
  selectThemeMode(state)

export const selectContributionVisualization = (
  state: ThemeSelectionRoot
): ThemeVisualization => {
  const mode = selectThemeMode(state)

  return isBuiltInThemeId(mode) ? themeProfiles[mode].visualization : CUSTOM_VISUALIZATION
}

type ThemeTogglePresentation =
  | Readonly<{ prefixLabel: string; customLabel: string }>
  | undefined

const selectThemeTogglePresentation = (
  _state: ThemeSelectionRoot,
  presentation: ThemeTogglePresentation
) => presentation

export const selectThemeToggleViewProps = createSelector(
  [selectThemeMode, selectThemeTogglePresentation],
  (mode, presentation): Omit<ThemeToggleViewProps, 'onCycle'> => ({
    prefixLabel: presentation?.prefixLabel ?? 'Theme',
    label: isBuiltInThemeId(mode)
      ? themeProfiles[mode].label
      : (presentation?.customLabel ?? ''),
  })
)
