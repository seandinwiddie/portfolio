/** @jest-environment jsdom */

import { waitFor } from '@testing-library/react-native'
import { SOUND_PREFERENCE_STORAGE_KEY } from '../../../../components/bridge/console/soundPreference/soundPreferenceTypes'
import { soundPreferenceToggled } from '../../../../entities/bridge/console/soundPreference/soundPreferenceSlice'
import { makeStore } from '../../../../../store'

describe('soundPreference listener', () => {
  it('persists the reducer-owned visitor choice after the toggle event', async () => {
    const setItem = jest.fn()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: jest.fn(() => null), setItem },
    })
    const store = makeStore({ autoBatch: false })

    store.dispatch(soundPreferenceToggled())

    await waitFor(() =>
      expect(setItem).toHaveBeenCalledWith(SOUND_PREFERENCE_STORAGE_KEY, 'disabled')
    )
  })
})
