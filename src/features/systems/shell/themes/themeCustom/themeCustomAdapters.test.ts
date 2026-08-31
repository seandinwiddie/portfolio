import { themeProfiles } from '../../../../../styles/themes/themeProfiles'
import {
  THEME_CSS_VARIABLES,
  toCssVariables,
} from '../../../../../styles/themes/themeProjections'
import { validateCustomThemeCss } from './themeCustomAdapters'

const validCss = (): string => {
  const declarations = Object.entries(toCssVariables(themeProfiles.mirage))
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
})
