/** @jest-environment jsdom */

import { SOUND_PREFERENCE_STORAGE_KEY } from '../../../../components/bridge/console/soundPreference/soundPreferenceTypes'
import {
  readStoredSoundPreference,
  soundPreferenceFromStored,
  writeStoredSoundPreference,
} from './soundPreferenceAdapters'

describe('soundPreference storage adapter', () => {
  it('decodes only the bounded storage contract', () => {
    expect(soundPreferenceFromStored('enabled')).toBe(true)
    expect(soundPreferenceFromStored('disabled')).toBe(false)
    expect(soundPreferenceFromStored('muted')).toBeNull()
    expect(soundPreferenceFromStored(true)).toBeNull()
  })

  it('reads and writes through the injected localStorage boundary', () => {
    const getItem = jest.fn(() => 'disabled')
    const setItem = jest.fn()

    expect(readStoredSoundPreference({ getItem })).toBe(false)
    writeStoredSoundPreference({ setItem }, true)

    expect(getItem).toHaveBeenCalledWith(SOUND_PREFERENCE_STORAGE_KEY)
    expect(setItem).toHaveBeenCalledWith(SOUND_PREFERENCE_STORAGE_KEY, 'enabled')
  })

  it('fails closed when browser storage is unavailable', () => {
    expect(
      readStoredSoundPreference({
        getItem: () => {
          throw new Error('blocked storage')
        },
      })
    ).toBeNull()

    expect(() =>
      writeStoredSoundPreference(
        {
          setItem: () => {
            throw new Error('blocked storage')
          },
        },
        false
      )
    ).not.toThrow()
  })
})
