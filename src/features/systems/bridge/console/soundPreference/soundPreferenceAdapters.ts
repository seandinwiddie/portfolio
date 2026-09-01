import { fromNullable, match } from 'functional-programming-composition'
import {
  SOUND_PREFERENCE_STORAGE_KEY,
  type SoundPreferenceStorageValue,
} from '../../../../components/bridge/console/soundPreference/soundPreferenceTypes'

export type SoundPreferenceStorage = Readonly<{
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}>

const ENABLED_VALUE: SoundPreferenceStorageValue = 'enabled'
const DISABLED_VALUE: SoundPreferenceStorageValue = 'disabled'

const enabledByStorageValue: Readonly<
  Partial<Record<SoundPreferenceStorageValue, boolean>>
> = {
  [ENABLED_VALUE]: true,
  [DISABLED_VALUE]: false,
}

export const soundPreferenceFromStored = (value: unknown): boolean | null =>
  match(
    fromNullable(
      typeof value === 'string'
        ? enabledByStorageValue[value as SoundPreferenceStorageValue]
        : undefined
    ),
    (enabled) => enabled,
    () => null
  )

export const readStoredSoundPreference = (
  storage: Pick<SoundPreferenceStorage, 'getItem'> | undefined
): boolean | null => {
  try {
    return soundPreferenceFromStored(storage?.getItem(SOUND_PREFERENCE_STORAGE_KEY))
  } catch {
    return null
  }
}

export const readBrowserSoundPreference = (): boolean | null => {
  try {
    return readStoredSoundPreference(globalThis.localStorage)
  } catch {
    return null
  }
}

const storedValueFor = (enabled: boolean): SoundPreferenceStorageValue =>
  enabled ? ENABLED_VALUE : DISABLED_VALUE

export const writeStoredSoundPreference = (
  storage: Pick<SoundPreferenceStorage, 'setItem'> | undefined,
  enabled: boolean
): void => {
  try {
    storage?.setItem(SOUND_PREFERENCE_STORAGE_KEY, storedValueFor(enabled))
  } catch {
    return
  }
}

export const writeBrowserSoundPreference = (enabled: boolean): void => {
  try {
    writeStoredSoundPreference(globalThis.localStorage, enabled)
  } catch {
    return
  }
}
