export const BUILT_IN_THEME_IDS = ['dark', 'dracula', 'light', 'mirage', 'neon'] as const

export const CUSTOM_THEME_ID = 'custom' as const

export type BuiltInThemeId = (typeof BUILT_IN_THEME_IDS)[number]
export type ThemeMode = BuiltInThemeId | typeof CUSTOM_THEME_ID
export type ThemeAppearance = 'dark' | 'light'

export const isBuiltInThemeId = (value: string): value is BuiltInThemeId =>
  BUILT_IN_THEME_IDS.some((id) => id === value)

export const isThemeMode = (value: string): value is ThemeMode =>
  value === CUSTOM_THEME_ID || isBuiltInThemeId(value)

export const builtInThemeIdFrom = (value: unknown): BuiltInThemeId | null =>
  typeof value === 'string' && isBuiltInThemeId(value) ? value : null

export type ThemeSource = Readonly<{
  name: string
  revision: string
  url: string
}>

export type ContributionRamp = readonly [string, string, string, string, string]

export type ThemeVisualization = Readonly<{
  contributionRamp: ContributionRamp
  axisInk: string
}>

export type ThemeRoles = Readonly<{
  background: string
  surface: string
  surfaceRaised: string
  overlay: string
  foreground: string
  muted: string
  mutedText: string
  border: string
  controlBorder: string
  accent: string
  accentForeground: string
  link: string
  linkHover: string
  selection: string
  lineHighlight: string
  gutter: string
  focus: string
  controlBackground: string
  controlBackgroundHover: string
  controlForeground: string
  danger: string
  dangerText: string
  warning: string
  warningText: string
  success: string
  successText: string
  info: string
  infoText: string
}>

export type SyntaxRoles = Readonly<{
  tag: string
  function: string
  entity: string
  string: string
  regexp: string
  markup: string
  keyword: string
  special: string
  comment: string
  constant: string
  operator: string
}>

export type ThemeProfile = Readonly<{
  id: BuiltInThemeId
  label: string
  appearance: ThemeAppearance
  icon: string
  source: ThemeSource
  roles: ThemeRoles
  syntax: SyntaxRoles
  visualization: ThemeVisualization
  effects: Readonly<{ opacity: string }>
}>
