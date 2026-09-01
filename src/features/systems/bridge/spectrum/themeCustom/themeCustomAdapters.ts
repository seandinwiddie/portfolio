import {
  ebind,
  efmap,
  ematch,
  fromNullable,
  left,
  match,
  right,
  type Either,
} from 'functional-programming-composition'
import { getDocumentAsync, type DocumentPickerAsset } from 'expo-document-picker'
import { readAsStringAsync } from 'expo-file-system'
import {
  THEME_CSS_VARIABLES,
  type ThemeCssVariable,
} from '../../../../../styles/themes/themeProjections'
import { relativeLuminance } from '../../../../../styles/themes/themeColorMath'
import type { ThemeAppearance, ThemeMode } from '../../../../../styles/themes/themeTypes'

const CUSTOM_STYLE_SELECTOR = 'style[data-custom-theme]'
const CUSTOM_THEME_BLOCK = /(?:^|\s)\.theme-custom\s*\{([^{}]*)\}/u
const CSS_COMMENT = /\/\*[\s\S]*?\*\//gu
const HEX_COLOR = /^#[\da-f]{6}(?:[\da-f]{2})?$/iu
const OPACITY = /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/u
const QUOTED_LABEL = /^"[^"\\\r\n]{1,80}"$/u
const SAFE_ICON = /^[^;{}()<>\\\r\n]{1,16}$/u
const MINIMUM_VISIBLE_FX_OPACITY = 0.12
export const MAX_CUSTOM_THEME_BYTES = 64 * 1024

const CUSTOM_THEME_SIZE_ERROR =
  'Custom theme must have valid size metadata and be 64 KiB or smaller'

type ThemeDeclaration = readonly [ThemeCssVariable, string]
type WebThemeContext = Readonly<{ activeDocument: Document; activeWindow: Window }>

const LIGHT_SURFACE_LUMINANCE = 0.5

const isThemeCssVariable = (value: string): value is ThemeCssVariable =>
  THEME_CSS_VARIABLES.some((name) => name === value)

const parseDeclaration = (source: string): ThemeDeclaration | null => {
  const separator = source.indexOf(':')
  const name = source.slice(0, separator).trim()
  const value = source.slice(separator + 1).trim()

  return separator > 0 && isThemeCssVariable(name) ? [name, value] : null
}

const fxOpacityIsVisible = (value: string): boolean =>
  OPACITY.test(value) && Number.parseFloat(value) >= MINIMUM_VISIBLE_FX_OPACITY

const valueIsValid = ([name, value]: ThemeDeclaration): boolean =>
  name === '--theme-label'
    ? QUOTED_LABEL.test(value)
    : name === '--theme-icon'
      ? SAFE_ICON.test(value)
      : name === '--fx-opacity'
        ? fxOpacityIsVisible(value)
        : HEX_COLOR.test(value)

const declarationEntriesFrom = (source: string): Either<string, ThemeDeclaration[]> => {
  const block = source.match(CUSTOM_THEME_BLOCK)?.[1]
  const parts = (block ?? '')
    .replace(CSS_COMMENT, '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  const declarations = parts
    .map(parseDeclaration)
    .filter((entry): entry is ThemeDeclaration => entry !== null && valueIsValid(entry))

  return declarations.length === parts.length
    ? right(declarations)
    : left('Custom theme contains an unknown or unsafe semantic role')
}

const orderedDeclarationsFrom = (entries: ThemeDeclaration[]): ThemeDeclaration[] =>
  THEME_CSS_VARIABLES.map((name) =>
    entries.find(([candidate]) => candidate === name)
  ).filter((entry): entry is ThemeDeclaration => entry !== undefined)

const completeDeclarationsFrom = (source: string): Either<string, ThemeDeclaration[]> =>
  ebind(declarationEntriesFrom(source), (entries) => {
    const declarations = orderedDeclarationsFrom(entries)
    const complete =
      declarations.length === THEME_CSS_VARIABLES.length &&
      entries.length === THEME_CSS_VARIABLES.length

    return complete
      ? right(declarations)
      : left('Custom theme must define every canonical semantic role exactly once')
  })

const stylesheetFrom = (declarations: ThemeDeclaration[]): string => {
  const properties = declarations
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')

  return `.theme-custom {\n${properties}\n}\n`
}

export const customThemeAppearanceFrom = (stylesheet: string): ThemeAppearance => {
  const background = stylesheet.match(
    /--background-color:\s*(#[\da-f]{6})(?:[\da-f]{2})?\s*;/iu
  )?.[1]

  return background !== undefined &&
    relativeLuminance(background) >= LIGHT_SURFACE_LUMINANCE
    ? 'light'
    : 'dark'
}

export const validateCustomThemeCss = (source: string): Either<string, string> =>
  efmap(completeDeclarationsFrom(source), stylesheetFrom)

const webThemeContext = (): Either<string, WebThemeContext> =>
  typeof document === 'undefined' || typeof window === 'undefined'
    ? left('Custom themes are available on the web build')
    : right({ activeDocument: document, activeWindow: window })

export const removeCustomThemeStyle = (): void =>
  typeof document === 'undefined'
    ? undefined
    : document
        .querySelectorAll(CUSTOM_STYLE_SELECTOR)
        .forEach((element) => element.remove())

const installStylesheet = (activeDocument: Document, css: string): ThemeAppearance => {
  const style = activeDocument.createElement('style')

  style.textContent = css
  style.setAttribute('data-custom-theme', '')
  removeCustomThemeStyle()
  activeDocument.head.appendChild(style)
  return customThemeAppearanceFrom(css)
}

export const installCustomThemeStyle = (
  source: string
): Either<string, ThemeAppearance> =>
  ebind(validateCustomThemeCss(source), (css) =>
    efmap(webThemeContext(), ({ activeDocument }) =>
      installStylesheet(activeDocument, css)
    )
  )

const assetSizeFrom = (asset: DocumentPickerAsset): number | undefined =>
  asset.size ?? asset.file?.size

const sizeIsWithinCustomThemeLimit = (bytes: number): boolean =>
  Number.isSafeInteger(bytes) && bytes >= 0 && bytes <= MAX_CUSTOM_THEME_BYTES

const validateCustomThemeAssetSize = (
  asset: DocumentPickerAsset
): Either<string, DocumentPickerAsset> =>
  match(
    fromNullable(assetSizeFrom(asset)),
    (bytes) =>
      sizeIsWithinCustomThemeLimit(bytes) ? right(asset) : left(CUSTOM_THEME_SIZE_ERROR),
    () => left(CUSTOM_THEME_SIZE_ERROR)
  )

const cssFromAsset = (asset: DocumentPickerAsset): Promise<string> =>
  match(
    fromNullable(asset.file),
    (file) => file.text(),
    () => readAsStringAsync(asset.uri)
  )

export const readCustomThemeCssFromAsset = (
  asset: DocumentPickerAsset
): Promise<Either<string, string>> =>
  ematch(
    validateCustomThemeAssetSize(asset),
    (message) => Promise.resolve(left(message)),
    (validAsset) => cssFromAsset(validAsset).then((css) => right(css))
  )

export const chooseCustomThemeCss = async (): Promise<Either<string, string>> => {
  const result = await getDocumentAsync({
    type: 'text/css',
    copyToCacheDirectory: true,
    multiple: false,
  })
  const asset = result.canceled ? null : (result.assets[0] ?? null)

  return asset === null
    ? left('Theme selection cancelled')
    : readCustomThemeCssFromAsset(asset)
}

const activeThemeCss = ({
  activeDocument,
  activeWindow,
}: WebThemeContext): Either<string, string> => {
  const computed = activeWindow.getComputedStyle(activeDocument.body)
  const declarations = THEME_CSS_VARIABLES.map(
    (name) => `  ${name}: ${computed.getPropertyValue(name).trim()};`
  ).join('\n')

  return validateCustomThemeCss(`.theme-custom {\n${declarations}\n}`)
}

const triggerThemeDownload =
  ({ activeDocument }: WebThemeContext, mode: ThemeMode) =>
  (stylesheet: string): void => {
    const css = `/* Exported from the ${mode} semantic theme. */\n${stylesheet}`
    const link = activeDocument.createElement('a')

    link.href = `data:text/css;charset=utf-8,${encodeURIComponent(css)}`
    link.download = 'theme-custom.css'
    link.hidden = true
    activeDocument.body.appendChild(link)
    link.click()
    link.remove()
  }

export const downloadActiveTheme = (mode: ThemeMode): Either<string, void> =>
  ebind(webThemeContext(), (context) =>
    efmap(activeThemeCss(context), triggerThemeDownload(context, mode))
  )
