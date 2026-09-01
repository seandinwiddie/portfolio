import { readAsStringAsync } from 'expo-file-system'
import { themeProfiles } from '../../../../../styles/themes/themeProfiles'
import {
  THEME_CSS_VARIABLES,
  toCssVariables,
} from '../../../../../styles/themes/themeProjections'
import {
  customThemeAppearanceFrom,
  MAX_CUSTOM_THEME_BYTES,
  readCustomThemeCssFromAsset,
  validateCustomThemeCss,
} from './themeCustomAdapters'

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
}))

const validCss = (
  profile: (typeof themeProfiles)[keyof typeof themeProfiles] = themeProfiles.mirage
): string => {
  const declarations = Object.entries(toCssVariables(profile))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')

  return `.theme-custom {\n${declarations}\n}`
}

describe('custom theme validation', () => {
  it('projects a complete canonical role-only stylesheet', () => {
    const validated = validateCustomThemeCss(validCss())

    expect(validated).toMatchObject({ _tag: 'Right' })
    expect(
      validated._tag === 'Right' &&
        THEME_CSS_VARIABLES.every((name) => validated.right.includes(`${name}:`))
    ).toBe(true)
    expect(validated._tag === 'Right' ? validated.right : '').toMatch(
      /^\.theme-custom \{/u
    )
  })

  it('rejects incomplete themes', () => {
    expect(
      validateCustomThemeCss('.theme-custom { --background-color: #000000; }')
    ).toEqual({
      _tag: 'Left',
      left: 'Custom theme must define every canonical semantic role exactly once',
    })
  })

  it('rejects injected selectors and unsafe role values', () => {
    const unsafe = validCss().replace(
      '--background-color: #1F2430;',
      '--background-color: url(https://example.invalid/pixel);'
    )

    expect(validateCustomThemeCss(unsafe)).toEqual({
      _tag: 'Left',
      left: 'Custom theme contains an unknown or unsafe semantic role',
    })
  })

  it.each(['0', '0.0', '0.01', '0.119'])(
    'rejects an effectively disabled FX opacity of %s',
    (opacity) => {
      const disabled = validCss().replace(
        '--fx-opacity: 0.34;',
        `--fx-opacity: ${opacity};`
      )

      expect(validateCustomThemeCss(disabled)).toEqual({
        _tag: 'Left',
        left: 'Custom theme contains an unknown or unsafe semantic role',
      })
    }
  )

  it('accepts the minimum visible custom FX opacity', () => {
    const visible = validCss().replace('--fx-opacity: 0.34;', '--fx-opacity: 0.12;')

    expect(validateCustomThemeCss(visible)).toMatchObject({ _tag: 'Right' })
  })

  it('derives light and dark browser surfaces from validated theme color', () => {
    expect(customThemeAppearanceFrom(validCss(themeProfiles.light))).toBe('light')
    expect(customThemeAppearanceFrom(validCss(themeProfiles.mirage))).toBe('dark')
  })

  it('rejects oversized metadata before reading either asset representation', async () => {
    const fileText = jest.fn(async () => validCss())
    const oversizedMetadata = {
      name: 'oversized.css',
      size: MAX_CUSTOM_THEME_BYTES + 1,
      uri: 'file:///oversized.css',
    }

    const webResult = await readCustomThemeCssFromAsset({
      ...oversizedMetadata,
      file: {
        size: MAX_CUSTOM_THEME_BYTES + 1,
        text: fileText,
      } as unknown as File,
    })
    const nativeResult = await readCustomThemeCssFromAsset(oversizedMetadata)

    expect(webResult).toEqual({
      _tag: 'Left',
      left: 'Custom theme must have valid size metadata and be 64 KiB or smaller',
    })
    expect(nativeResult).toEqual(webResult)
    expect(fileText).not.toHaveBeenCalled()
    expect(readAsStringAsync).not.toHaveBeenCalled()
  })
})
