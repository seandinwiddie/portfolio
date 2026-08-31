import { ayuDarkPalette, ayuLightPalette, ayuMiragePalette } from './ayuThemePalettes'
import { ayuDarkProfile, ayuLightProfile, ayuMirageProfile } from './ayuThemeProfiles'
import { draculaPalette, draculaThemeProfile } from './draculaThemeProfile'
import { synthWavePalette, synthWaveThemeProfile } from './synthWaveThemeProfile'
import { BUILT_IN_THEME_IDS, type BuiltInThemeId, type ThemeProfile } from './themeTypes'

export const DEFAULT_THEME_ID: BuiltInThemeId = 'mirage'

export const canonicalPalettes = {
  dark: ayuDarkPalette,
  dracula: draculaPalette,
  light: ayuLightPalette,
  mirage: ayuMiragePalette,
  neon: synthWavePalette,
} as const satisfies Record<BuiltInThemeId, Readonly<Record<string, string>>>

export const themeProfiles = {
  dark: ayuDarkProfile,
  dracula: draculaThemeProfile,
  light: ayuLightProfile,
  mirage: ayuMirageProfile,
  neon: synthWaveThemeProfile,
} as const satisfies Record<BuiltInThemeId, ThemeProfile>

export const builtInThemeProfiles = BUILT_IN_THEME_IDS.map((id) => themeProfiles[id])
