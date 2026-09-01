import { deriveContrastColor, sequentialRamp } from './themeColorMath'
import type { ThemeProfile } from './themeTypes'

/**
 * An original palette informed by practical, high-legibility industrial screen
 * design. The linked production dossier is visual research, not a palette
 * specification; every color below is authored for this interface.
 */
export const rubyCrystalPalette = {
  background: '#090507',
  surface: '#14080D',
  surfaceRaised: '#241018',
  overlay: '#050203',
  foreground: '#FFF0F2',
  controlForeground: '#FFF4F5',
  muted: '#7B3547',
  border: '#7D1D36',
  accent: '#FF335F',
  link: '#FF7893',
  linkHover: '#FFC2CF',
  selection: '#FF335F38',
  lineHighlight: '#71183166',
  gutter: '#A5717E',
  controlBackground: '#8F1533',
  controlBackgroundHover: '#5B1025',
  danger: '#FF4964',
  warning: '#FFB36B',
  success: '#67E1B0',
  info: '#82CFFF',
  crystal: '#FF9AAE',
} as const

export const RUBY_CRYSTAL_REVISION = 'visual-research-2026-08-31'

const surfaces = [
  rubyCrystalPalette.background,
  rubyCrystalPalette.surface,
  rubyCrystalPalette.surfaceRaised,
]
const mutedText = deriveContrastColor(surfaces, 4.5)(
  rubyCrystalPalette.muted,
  rubyCrystalPalette.foreground
)
const controlBorder = deriveContrastColor(surfaces, 3)(
  rubyCrystalPalette.border,
  rubyCrystalPalette.foreground
)

export const rubyCrystalThemeProfile: ThemeProfile = {
  id: 'ruby',
  label: 'Ruby Crystal',
  appearance: 'dark',
  icon: '💎',
  source: {
    name: 'Practical on-screen graphics visual research',
    revision: RUBY_CRYSTAL_REVISION,
    url: 'https://forresthogg.com/projects/alien-romulus-gfx',
  },
  roles: {
    background: rubyCrystalPalette.background,
    surface: rubyCrystalPalette.surface,
    surfaceRaised: rubyCrystalPalette.surfaceRaised,
    overlay: rubyCrystalPalette.overlay,
    foreground: rubyCrystalPalette.foreground,
    muted: rubyCrystalPalette.muted,
    mutedText,
    border: rubyCrystalPalette.border,
    controlBorder,
    accent: rubyCrystalPalette.accent,
    accentForeground: rubyCrystalPalette.background,
    link: rubyCrystalPalette.link,
    linkHover: rubyCrystalPalette.linkHover,
    selection: rubyCrystalPalette.selection,
    lineHighlight: rubyCrystalPalette.lineHighlight,
    gutter: rubyCrystalPalette.gutter,
    focus: rubyCrystalPalette.accent,
    controlBackground: rubyCrystalPalette.controlBackground,
    controlBackgroundHover: rubyCrystalPalette.controlBackgroundHover,
    controlForeground: rubyCrystalPalette.controlForeground,
    danger: rubyCrystalPalette.danger,
    dangerText: rubyCrystalPalette.danger,
    warning: rubyCrystalPalette.warning,
    warningText: rubyCrystalPalette.warning,
    success: rubyCrystalPalette.success,
    successText: rubyCrystalPalette.success,
    info: rubyCrystalPalette.info,
    infoText: rubyCrystalPalette.info,
  },
  syntax: {
    tag: rubyCrystalPalette.crystal,
    function: rubyCrystalPalette.info,
    entity: rubyCrystalPalette.danger,
    string: rubyCrystalPalette.warning,
    regexp: rubyCrystalPalette.link,
    markup: rubyCrystalPalette.accent,
    keyword: rubyCrystalPalette.crystal,
    special: rubyCrystalPalette.accent,
    comment: mutedText,
    constant: rubyCrystalPalette.link,
    operator: rubyCrystalPalette.warning,
  },
  visualization: {
    contributionRamp: sequentialRamp(
      rubyCrystalPalette.surface,
      rubyCrystalPalette.accent
    ),
    axisInk: mutedText,
  },
  effects: { opacity: '0.66' },
}
