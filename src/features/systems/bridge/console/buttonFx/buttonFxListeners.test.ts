import { waitFor } from '@testing-library/react-native'
import {
  buttonFxHovered,
  buttonFxPressed,
} from '../../../../entities/bridge/console/buttonFx/buttonFxActions'
import {
  soundPreferenceToggled,
  storedSoundPreferenceRestored,
} from '../../../../entities/bridge/console/soundPreference/soundPreferenceSlice'
import { makeStore } from '../../../../../store'
import { playButtonFxCue } from './buttonFxAdapters'

jest.mock('./buttonFxAdapters', () => ({
  ...jest.requireActual('./buttonFxAdapters'),
  playButtonFxCue: jest.fn(() => Promise.resolve()),
}))

const mockedPlayButtonFxCue = jest.mocked(playButtonFxCue)

describe('buttonFx sound preference', () => {
  beforeEach(() => mockedPlayButtonFxCue.mockClear())

  it('keeps audio silent before restoration and after an explicit disable', async () => {
    const store = makeStore({ autoBatch: false })

    store.dispatch(buttonFxHovered({ identity: 'button:test' }))
    await Promise.resolve()
    expect(mockedPlayButtonFxCue).not.toHaveBeenCalled()

    store.dispatch(storedSoundPreferenceRestored(true))
    store.dispatch(buttonFxPressed({ identity: 'button:test' }))
    await waitFor(() => expect(mockedPlayButtonFxCue).toHaveBeenCalledTimes(1))

    store.dispatch(soundPreferenceToggled())
    store.dispatch(buttonFxPressed({ identity: 'button:test' }))
    await Promise.resolve()
    expect(mockedPlayButtonFxCue).toHaveBeenCalledTimes(1)
  })
})
