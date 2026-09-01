import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  customTamaguiTheme,
  THEME_CSS_VARIABLES,
  tamaguiThemes,
  toCssVariables,
  toTamaguiTheme,
} from '../themes/themeProjections'
import { canonicalPalettes, themeProfiles } from '../themes/themeProfiles'
import { BUILT_IN_THEME_IDS } from '../themes/themeTypes'

const declarationsFrom = (css: string): Readonly<Record<string, string>> =>
  Object.fromEntries(
    Array.from(css.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);$/gmu)).map(
      ([, name, value]) => [name, value.trim()]
    )
  )

const cssFor = (id: (typeof BUILT_IN_THEME_IDS)[number]): string =>
  readFileSync(join(process.cwd(), 'src', 'styles', 'themes', `theme-${id}.css`), 'utf8')

const channelToLinear = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

const channelsFrom = (hex: string): readonly number[] =>
  (hex.slice(1).match(/.{2}/g) ?? []).map((channel) => Number.parseInt(channel, 16) / 255)

const relativeLuminance = (hex: string): number => {
  const [red, green, blue] = channelsFrom(hex).map(channelToLinear)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

const contrastRatio = (foreground: string, background: string): number => {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)]
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
}

describe('audited theme profiles', () => {
  it('keeps the six stored IDs stable and presents the authored theme identities', () => {
    expect(BUILT_IN_THEME_IDS).toEqual([
      'dark',
      'dracula',
      'light',
      'mirage',
      'neon',
      'ruby',
    ])
    expect(themeProfiles.neon).toMatchObject({
      id: 'neon',
      label: "SynthWave '84",
    })
    expect(themeProfiles.ruby).toMatchObject({
      id: 'ruby',
      label: 'Ruby Crystal',
    })
  })

  it('pins the audited upstream revisions', () => {
    expect(themeProfiles.dark.source.revision).toBe(
      'e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c'
    )
    expect(themeProfiles.light.source.revision).toBe(themeProfiles.dark.source.revision)
    expect(themeProfiles.mirage.source.revision).toBe(themeProfiles.dark.source.revision)
    expect(themeProfiles.dracula.source.revision).toBe(
      'ac4c351c763aeca2cc093b8ae77a6c3160bb1125'
    )
    expect(themeProfiles.neon.source.revision).toBe(
      'ecfa2fe1279f7233663fa3f98a96e6756000567b'
    )
    expect(themeProfiles.ruby.source.revision).toBe('visual-research-2026-08-31')
  })

  it('preserves exact upstream and authored palette values', () => {
    expect(canonicalPalettes).toMatchObject({
      dark: {
        surfaceBase: '#0D1017',
        surfaceLift: '#10141C',
        editorForeground: '#BFBDB6',
        accent: '#E6B450',
        constant: '#D2A6FF',
      },
      light: {
        surfaceBase: '#F8F9FA',
        surfaceLift: '#FCFCFC',
        editorForeground: '#5C6166',
        accent: '#F29718',
        constant: '#A37ACC',
      },
      mirage: {
        surfaceBase: '#1F2430',
        surfaceLift: '#242936',
        editorForeground: '#CCCAC2',
        accent: '#FFCC66',
        constant: '#DFBFFF',
      },
      dracula: {
        background: '#282A36',
        currentLine: '#6272A4',
        selection: '#44475A',
        floating: '#343746',
        functionalPurple: '#815CD6',
      },
      neon: {
        editorBackground: '#262335',
        sidebarBackground: '#241B2F',
        button: '#614D85',
        tag: '#72F1B8',
        function: '#36F9F6',
        keyword: '#FEDE5D',
      },
      ruby: {
        background: '#090507',
        surface: '#14080D',
        accent: '#FF335F',
        crystal: '#FF9AAE',
        controlBackground: '#8F1533',
      },
    })
  })
})

describe.each(BUILT_IN_THEME_IDS)('%s theme projections', (id) => {
  const profile = themeProfiles[id]

  it('keeps its CSS asset complete and exactly in parity with the catalog', () => {
    const declarations = declarationsFrom(cssFor(id))

    expect(Object.keys(declarations).sort()).toEqual([...THEME_CSS_VARIABLES].sort())
    expect(declarations).toEqual(toCssVariables(profile))
    expect(declarations).toMatchObject({
      '--muted-color': profile.roles.mutedText,
      '--muted-ui-color': profile.roles.muted,
      '--selection-color': profile.roles.selection,
      '--signal-color': profile.roles.accent,
      '--danger-color': profile.roles.danger,
      '--fx-opacity': profile.effects.opacity,
    })
  })

  it('contains palette data only, leaving shared interaction behavior to app.css', () => {
    expect(cssFor(id)).not.toMatch(/\.theme-[a-z]+\s+(?:a|button|h[1-6])\b/u)
  })

  it('derives its Tamagui theme from the same semantic roles', () => {
    expect(tamaguiThemes[id]).toEqual(toTamaguiTheme(profile))
    expect(tamaguiThemes[id]).toMatchObject({
      background: profile.roles.background,
      color: profile.roles.foreground,
      borderColor: profile.roles.border,
      borderColorFocus: profile.roles.focus,
      accent: profile.roles.accent,
      surface: profile.roles.surface,
      controlBackground: profile.roles.controlBackground,
    })
  })

  it('meets AA for body, link, control, and semantic status text', () => {
    const { roles } = profile
    const textColors = [
      roles.foreground,
      roles.mutedText,
      roles.link,
      roles.dangerText,
      roles.warningText,
      roles.successText,
      roles.infoText,
    ]

    expect(
      textColors.every((color) => contrastRatio(color, roles.background) >= 4.5)
    ).toBe(true)
    expect(
      contrastRatio(roles.controlForeground, roles.controlBackground)
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(roles.controlForeground, roles.controlBackgroundHover)
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('meets the non-text contrast threshold for its focus indicator', () => {
    const focusGrounds = [
      profile.roles.background,
      profile.roles.surface,
      profile.roles.surfaceRaised,
    ]

    expect(
      focusGrounds.every((ground) => contrastRatio(profile.roles.focus, ground) >= 3)
    ).toBe(true)
  })

  it('keeps its control boundary perceivable across every control ground', () => {
    const controlGrounds = [profile.roles.background, profile.roles.surface]

    expect(
      controlGrounds.every(
        (ground) => contrastRatio(profile.roles.controlBorder, ground) >= 3
      )
    ).toBe(true)
  })

  it('provides a complete usable sequential contribution visualization', () => {
    const { axisInk, contributionRamp } = profile.visualization
    const adjacentPairs = contributionRamp
      .slice(1)
      .map((color, index) => [contributionRamp[index], color] as const)

    expect(new Set(contributionRamp).size).toBe(5)
    expect(contrastRatio(axisInk, profile.roles.background)).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(contributionRamp[4], profile.roles.background)
    ).toBeGreaterThanOrEqual(3)
    expect(
      adjacentPairs.every(([lower, higher]) => contrastRatio(lower, higher) >= 1.25)
    ).toBe(true)
  })
})

describe('theme visualization catalog', () => {
  it('uses a distinct contribution ramp for every shipped theme', () => {
    const ramps = BUILT_IN_THEME_IDS.map((id) =>
      themeProfiles[id].visualization.contributionRamp.join(':')
    )

    expect(new Set(ramps).size).toBe(BUILT_IN_THEME_IDS.length)
  })

  it('projects every custom Tamagui role from validated CSS authority', () => {
    expect(Object.keys(customTamaguiTheme).sort()).toEqual(
      Object.keys(toTamaguiTheme(themeProfiles.mirage)).sort()
    )
    expect(
      Object.values(customTamaguiTheme).every(
        (value) => typeof value === 'string' && value.startsWith('var(--')
      )
    ).toBe(true)
  })
})
