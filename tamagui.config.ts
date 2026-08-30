import { createTamagui } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/themes'
import { createMedia } from '@tamagui/react-native-media-driver'
import { createAnimations } from '@tamagui/animations-react-native'

const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
})

const dankMonoFont = {
  family: 'Dank Mono',
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
    10: 40,
    11: 48,
    12: 56,
    13: 64,
    14: 72,
    15: 80,
    16: 96,
  },
  lineHeight: {
    1: 17,
    2: 22,
    3: 25,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 56,
    11: 64,
    12: 72,
    13: 80,
    14: 88,
    15: 96,
    16: 112,
  },
  weight: {
    4: '400',
    7: '700',
  },
  letterSpacing: {
    4: 0,
    7: -1,
  },
}

const config = createTamagui({
  animations,
  defaultTheme: 'mirage',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: dankMonoFont,
    body: dankMonoFont,
  },
  // Single source of truth for the palettes, matching src/styles/themes/*.css
  // exactly. These were previously invented (dark was pure #000000/#FFFFFF),
  // so Tamagui components rendered a different palette than the page body.
  // Values verified against upstream: Ayu (ayu-theme/vscode-ayu), Dracula
  // (dracula/dracula-theme) and SynthWave '84 (robb0wen/synthwave-vscode).
  themes: {
    light: {
      background: '#FCFCFC',
      color: '#5C6166',
      borderColor: '#E9EBEC',
      gray5: '#828E9F',
      accent: '#F29718',
    },
    dark: {
      background: '#0B0E14',
      color: '#BFBDB6',
      borderColor: '#1B1F29',
      gray5: '#5A6378',
      accent: '#E6B450',
    },
    dracula: {
      background: '#282A36',
      color: '#F8F8F2',
      borderColor: '#44475A',
      gray5: '#6272A4',
      accent: '#BD93F9',
    },
    neon: {
      background: '#262335',
      color: '#FFFFFF',
      borderColor: '#34294F',
      gray5: '#848BBD',
      accent: '#FF7EDB',
    },
    mirage: {
      background: '#1F2430',
      color: '#CCCAC2',
      borderColor: '#171B24',
      gray5: '#707A8C',
      accent: '#FFCC66',
    },
  },
  tokens,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
