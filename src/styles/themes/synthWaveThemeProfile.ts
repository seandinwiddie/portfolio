import { deriveContrastColor, sequentialRamp } from './themeColorMath'
import type { ThemeProfile } from './themeTypes'

export const synthWavePalette = {
  editorBackground: '#262335',
  sidebarBackground: '#241B2F',
  inputBackground: '#2A2139',
  activityBarBackground: '#171520',
  foreground: '#FFFFFF',
  comment: '#848BBD',
  border: '#495495',
  selection: '#FFFFFF20',
  lineHighlight: '#7059AB66',
  lineNumber: '#FFFFFF73',
  focusBorder: '#1F212B',
  focusActive: '#FF7EDB',
  link: '#F97E72',
  linkActive: '#FF7EDB',
  button: '#614D85',
  error: '#FE4450',
  tag: '#72F1B8',
  function: '#36F9F6',
  string: '#FF8B39',
  keyword: '#FEDE5D',
  constant: '#F97E72',
  variable: '#FF7EDB',
} as const

export const SYNTH_WAVE_REVISION = 'ecfa2fe1279f7233663fa3f98a96e6756000567b'

const surfaces = [
  synthWavePalette.editorBackground,
  synthWavePalette.sidebarBackground,
  synthWavePalette.inputBackground,
]
const mutedText = deriveContrastColor(surfaces, 4.5)(
  synthWavePalette.comment,
  synthWavePalette.foreground
)

export const synthWaveThemeProfile: ThemeProfile = {
  id: 'neon',
  label: "SynthWave '84",
  appearance: 'dark',
  icon: '🌈',
  source: {
    name: "SynthWave '84",
    revision: SYNTH_WAVE_REVISION,
    url: `https://github.com/robb0wen/synthwave-vscode/blob/${SYNTH_WAVE_REVISION}/themes/synthwave-color-theme.json`,
  },
  roles: {
    background: synthWavePalette.editorBackground,
    surface: synthWavePalette.sidebarBackground,
    surfaceRaised: synthWavePalette.inputBackground,
    overlay: synthWavePalette.activityBarBackground,
    foreground: synthWavePalette.foreground,
    muted: synthWavePalette.comment,
    mutedText,
    border: synthWavePalette.border,
    controlBorder: deriveContrastColor(surfaces, 3)(
      synthWavePalette.border,
      synthWavePalette.foreground
    ),
    accent: synthWavePalette.focusActive,
    accentForeground: synthWavePalette.editorBackground,
    link: synthWavePalette.link,
    linkHover: synthWavePalette.linkActive,
    selection: synthWavePalette.selection,
    lineHighlight: synthWavePalette.lineHighlight,
    gutter: synthWavePalette.lineNumber,
    focus: synthWavePalette.focusActive,
    controlBackground: synthWavePalette.button,
    controlBackgroundHover: synthWavePalette.inputBackground,
    controlForeground: synthWavePalette.foreground,
    danger: synthWavePalette.error,
    dangerText: synthWavePalette.foreground,
    warning: synthWavePalette.keyword,
    warningText: synthWavePalette.keyword,
    success: synthWavePalette.tag,
    successText: synthWavePalette.tag,
    info: synthWavePalette.function,
    infoText: synthWavePalette.function,
  },
  syntax: {
    tag: synthWavePalette.tag,
    function: synthWavePalette.function,
    entity: synthWavePalette.error,
    string: synthWavePalette.string,
    regexp: synthWavePalette.constant,
    markup: synthWavePalette.error,
    keyword: synthWavePalette.keyword,
    special: synthWavePalette.variable,
    comment: synthWavePalette.comment,
    constant: synthWavePalette.constant,
    operator: synthWavePalette.keyword,
  },
  visualization: {
    contributionRamp: sequentialRamp(
      synthWavePalette.sidebarBackground,
      synthWavePalette.focusActive
    ),
    axisInk: mutedText,
  },
  effects: { opacity: '0.56' },
}
