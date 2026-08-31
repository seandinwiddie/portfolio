import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BUILT_IN_THEME_IDS,
  builtInThemeIdFrom,
  type BuiltInThemeId,
  type ThemeMode,
} from '../../../../../styles/themes/themeTypes'

const THEME_STORAGE_KEY = 'portfolio.themeMode'
const THEME_CLASS_PREFIX = 'theme-'

export const readStoredBuiltInTheme = async (): Promise<BuiltInThemeId | null> =>
  AsyncStorage.getItem(THEME_STORAGE_KEY)
    .then(builtInThemeIdFrom)
    .catch(() => null)

export const writeStoredBuiltInTheme = async (mode: BuiltInThemeId): Promise<void> =>
  AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => undefined)

const replaceThemeClass = (element: HTMLElement, mode: ThemeMode): void => {
  const priorThemeClasses = Array.from(element.classList).filter((name) =>
    name.startsWith(THEME_CLASS_PREFIX)
  )

  element.classList.remove(...priorThemeClasses)
  element.classList.add(`${THEME_CLASS_PREFIX}${mode}`)
}

export const applyThemeModeToDocument = (mode: ThemeMode): void => {
  if (typeof document === 'undefined') return

  replaceThemeClass(document.documentElement, mode)
  replaceThemeClass(document.body, mode)
}

export const shippedThemeIds = (): readonly BuiltInThemeId[] => BUILT_IN_THEME_IDS
