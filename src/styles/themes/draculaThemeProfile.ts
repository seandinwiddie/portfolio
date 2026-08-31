import { deriveContrastColor, sequentialRamp } from './themeColorMath'
import type { ThemeProfile } from './themeTypes'

export const draculaPalette = {
  background: '#282A36',
  floating: '#343746',
  backgroundLighter: '#424450',
  backgroundDark: '#21222C',
  foreground: '#F8F8F2',
  brightWhite: '#FFFFFF',
  currentLine: '#6272A4',
  lineHighlight: '#353747',
  selection: '#44475A',
  red: '#FF5555',
  orange: '#FFB86C',
  yellow: '#F1FA8C',
  green: '#50FA7B',
  cyan: '#8BE9FD',
  purple: '#BD93F9',
  pink: '#FF79C6',
  functionalRed: '#DE5735',
  functionalOrange: '#A39514',
  functionalGreen: '#089108',
  functionalCyan: '#0081D6',
  functionalPurple: '#815CD6',
} as const

export const DRACULA_REVISION = 'b1f9d35242a1a7ac3e45f3ad34843ffab700f8d2'

const surfaces = [
  draculaPalette.background,
  draculaPalette.floating,
  draculaPalette.backgroundLighter,
]
const mutedText = deriveContrastColor(surfaces, 4.5)(
  draculaPalette.currentLine,
  draculaPalette.foreground
)
const controlBorder = deriveContrastColor(surfaces, 3)(
  draculaPalette.currentLine,
  draculaPalette.foreground
)

export const draculaThemeProfile: ThemeProfile = {
  id: 'dracula',
  label: 'Dracula',
  appearance: 'dark',
  icon: '🧛',
  source: {
    name: 'Dracula Theme Specification',
    revision: DRACULA_REVISION,
    url: `https://github.com/dracula/draculatheme.com/blob/${DRACULA_REVISION}/content/spec.mdx`,
  },
  roles: {
    background: draculaPalette.background,
    surface: draculaPalette.floating,
    surfaceRaised: draculaPalette.backgroundLighter,
    overlay: draculaPalette.backgroundDark,
    foreground: draculaPalette.foreground,
    muted: draculaPalette.currentLine,
    mutedText,
    border: draculaPalette.currentLine,
    controlBorder,
    accent: draculaPalette.purple,
    accentForeground: draculaPalette.background,
    link: draculaPalette.cyan,
    linkHover: draculaPalette.pink,
    selection: draculaPalette.selection,
    lineHighlight: draculaPalette.lineHighlight,
    gutter: draculaPalette.currentLine,
    focus: draculaPalette.purple,
    controlBackground: draculaPalette.functionalPurple,
    controlBackgroundHover: draculaPalette.backgroundLighter,
    controlForeground: draculaPalette.brightWhite,
    danger: draculaPalette.functionalRed,
    dangerText: draculaPalette.red,
    warning: draculaPalette.functionalOrange,
    warningText: draculaPalette.orange,
    success: draculaPalette.functionalGreen,
    successText: draculaPalette.green,
    info: draculaPalette.functionalCyan,
    infoText: draculaPalette.cyan,
  },
  syntax: {
    tag: draculaPalette.cyan,
    function: draculaPalette.green,
    entity: draculaPalette.cyan,
    string: draculaPalette.yellow,
    regexp: draculaPalette.cyan,
    markup: draculaPalette.red,
    keyword: draculaPalette.pink,
    special: draculaPalette.purple,
    comment: draculaPalette.currentLine,
    constant: draculaPalette.orange,
    operator: draculaPalette.pink,
  },
  visualization: {
    contributionRamp: sequentialRamp(draculaPalette.floating, draculaPalette.purple),
    axisInk: mutedText,
  },
  effects: { opacity: '0.3' },
}
