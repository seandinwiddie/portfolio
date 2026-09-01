import AsyncStorage from '@react-native-async-storage/async-storage'
import { THEME_STORAGE_KEY } from '../../../../components/bridge/spectrum/themeSelection/themeSelectionTypes'
import {
  BUILT_IN_THEME_IDS,
  builtInThemeIdFrom,
  type BuiltInThemeId,
  type ThemeAppearance,
  type ThemeMode,
} from '../../../../../styles/themes/themeTypes'

const THEME_CLASS_PREFIX = 'theme-'

type ThemeStorageReader = Readonly<{
  getItem: (key: string) => string | null
}>

export const readBuiltInThemeAtBoot = (
  storage: ThemeStorageReader | undefined
): BuiltInThemeId | null => {
  try {
    return builtInThemeIdFrom(storage?.getItem(THEME_STORAGE_KEY))
  } catch {
    return null
  }
}

export const readBrowserBuiltInThemeAtBoot = (): BuiltInThemeId | null => {
  try {
    return readBuiltInThemeAtBoot(globalThis.localStorage)
  } catch {
    return null
  }
}

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

export const applyThemeModeToDocument = (
  mode: ThemeMode | null,
  appearance: ThemeAppearance
): void => {
  if (mode === null || typeof document === 'undefined') return

  replaceThemeClass(document.documentElement, mode)
  replaceThemeClass(document.body, mode)
  document.documentElement.style.colorScheme = appearance
}

export const shippedThemeIds = (): readonly BuiltInThemeId[] => BUILT_IN_THEME_IDS
