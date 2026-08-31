import { deriveContrastColor, sequentialRamp } from './themeColorMath'
import {
  ayuDarkPalette,
  ayuLightPalette,
  ayuMiragePalette,
  ayuSource,
  type AyuThemePalette,
} from './ayuThemePalettes'
import type { ThemeProfile } from './themeTypes'

const surfacesOf = (palette: AyuThemePalette) => [
  palette.surfaceBase,
  palette.surfaceLift,
  palette.panel,
]

const accessibleTextOf = (palette: AyuThemePalette): string =>
  deriveContrastColor(surfacesOf(palette), 4.5)(
    palette.uiForeground,
    palette.editorForeground
  )

const accessibleControlBorderOf = (palette: AyuThemePalette): string =>
  deriveContrastColor(surfacesOf(palette), 3)(
    palette.uiForeground,
    palette.editorForeground
  )

const contributionPeakOf = (palette: AyuThemePalette): string =>
  deriveContrastColor(surfacesOf(palette), 3)(palette.vcsAdded, palette.editorForeground)

const profileOf = (
  palette: AyuThemePalette,
  identity: Readonly<
    Pick<ThemeProfile, 'id' | 'label' | 'appearance' | 'icon' | 'source'>
  >
): ThemeProfile => {
  const mutedText = accessibleTextOf(palette)
  const contributionPeak = contributionPeakOf(palette)
  return {
    ...identity,
    roles: {
      background: palette.surfaceBase,
      surface: palette.surfaceLift,
      surfaceRaised: palette.panel,
      overlay: palette.popup,
      foreground: palette.editorForeground,
      muted: palette.uiForeground,
      mutedText,
      border: palette.uiLine,
      controlBorder: accessibleControlBorderOf(palette),
      accent: palette.accent,
      accentForeground: palette.accentOn,
      link: palette.entity,
      linkHover: palette.tag,
      selection: palette.selection,
      lineHighlight: palette.editorLine,
      gutter: palette.lineNumber,
      focus: palette.accent,
      controlBackground: palette.accent,
      controlBackgroundHover: palette.function,
      controlForeground: palette.surfaceBase,
      danger: palette.error,
      dangerText: palette.markup,
      warning: palette.function,
      warningText: palette.function,
      success: palette.vcsAdded,
      successText: palette.string,
      info: palette.entity,
      infoText: palette.entity,
    },
    syntax: {
      tag: palette.tag,
      function: palette.function,
      entity: palette.entity,
      string: palette.string,
      regexp: palette.regexp,
      markup: palette.markup,
      keyword: palette.keyword,
      special: palette.special,
      comment: palette.comment,
      constant: palette.constant,
      operator: palette.operator,
    },
    visualization: {
      contributionRamp: sequentialRamp(palette.surfaceLift, contributionPeak),
      axisInk: mutedText,
    },
    effects: { opacity: '0.32' },
  }
}

export const ayuDarkProfile = profileOf(ayuDarkPalette, {
  id: 'dark',
  label: 'Ayu Dark',
  appearance: 'dark',
  icon: '🌙',
  source: ayuSource('dark'),
})

const ayuLightBase = profileOf(ayuLightPalette, {
  id: 'light',
  label: 'Ayu Light',
  appearance: 'light',
  icon: '🌞',
  source: ayuSource('light'),
})

export const ayuLightProfile: ThemeProfile = {
  ...ayuLightBase,
  roles: {
    ...ayuLightBase.roles,
    link: ayuLightPalette.accentOn,
    linkHover: ayuLightPalette.editorForeground,
    focus: ayuLightPalette.accentOn,
    controlBackground: ayuLightPalette.accentOn,
    controlBackgroundHover: ayuLightPalette.editorForeground,
    controlForeground: ayuLightPalette.surfaceLift,
    dangerText: ayuLightPalette.editorForeground,
    warningText: ayuLightPalette.accentOn,
    successText: ayuLightPalette.editorForeground,
    infoText: ayuLightPalette.editorForeground,
  },
  effects: { opacity: '0.18' },
}

const ayuMirageBase = profileOf(ayuMiragePalette, {
  id: 'mirage',
  label: 'Ayu Mirage',
  appearance: 'dark',
  icon: '🌌',
  source: ayuSource('mirage'),
})

export const ayuMirageProfile: ThemeProfile = {
  ...ayuMirageBase,
  roles: {
    ...ayuMirageBase.roles,
    dangerText: ayuMiragePalette.error,
  },
  effects: { opacity: '0.34' },
}
