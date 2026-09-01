import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'
import type { SoundPreferenceState } from './soundPreferenceSlice'
import {
  selectSoundPlaybackEnabled,
  selectSoundPreferenceViewModel,
} from './soundPreferenceSelectors'

const stateWith = (soundPreference: SoundPreferenceState) => ({ soundPreference })

describe('soundPreference selectors', () => {
  it('gates playback until restoration completes', () => {
    expect(
      selectSoundPlaybackEnabled(
        stateWith({
          enabled: true,
          restorationStatus: 'pending',
          authority: 'default',
        })
      )
    ).toBe(false)
    expect(
      selectSoundPlaybackEnabled(
        stateWith({
          enabled: true,
          restorationStatus: 'ready',
          authority: 'stored',
        })
      )
    ).toBe(true)
  })

  it('projects API-authored state and action labels without local copy', () => {
    const enabled = selectSoundPreferenceViewModel(
      stateWith({
        enabled: true,
        restorationStatus: 'ready',
        authority: 'default',
      }),
      TEST_RUNTIME_PRESENTATION.sound
    )
    const disabled = selectSoundPreferenceViewModel(
      stateWith({
        enabled: false,
        restorationStatus: 'ready',
        authority: 'visitor',
      }),
      TEST_RUNTIME_PRESENTATION.sound
    )

    expect(enabled).toEqual({
      enabled: true,
      ready: true,
      text: 'Test sound on',
      label: 'Test disable sound',
    })
    expect(disabled).toEqual({
      enabled: false,
      ready: true,
      text: 'Test sound off',
      label: 'Test enable sound',
    })
  })

  it('withholds the control until API presentation arrives', () => {
    expect(
      selectSoundPreferenceViewModel(
        stateWith({
          enabled: true,
          restorationStatus: 'ready',
          authority: 'default',
        }),
        undefined
      )
    ).toEqual({ enabled: true, ready: false, text: '', label: '' })
  })
})
