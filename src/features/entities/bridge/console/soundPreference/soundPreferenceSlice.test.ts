import reducer, {
  initialSoundPreferenceState,
  soundPreferenceToggled,
  storedSoundPreferenceRestored,
} from './soundPreferenceSlice'

describe('soundPreference slice', () => {
  it('defaults to enabled while restoration is pending', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual({
      enabled: true,
      restorationStatus: 'pending',
      authority: 'default',
    })
  })

  it('restores a valid stored choice and marks restoration ready', () => {
    expect(
      reducer(initialSoundPreferenceState, storedSoundPreferenceRestored(false))
    ).toEqual({
      enabled: false,
      restorationStatus: 'ready',
      authority: 'stored',
    })
  })

  it('keeps the enabled default when storage has no valid preference', () => {
    expect(
      reducer(initialSoundPreferenceState, storedSoundPreferenceRestored(null))
    ).toEqual({
      enabled: true,
      restorationStatus: 'ready',
      authority: 'default',
    })
  })

  it('never lets late restoration replace a visitor event', () => {
    const visitor = reducer(initialSoundPreferenceState, soundPreferenceToggled())
    const restored = reducer(visitor, storedSoundPreferenceRestored(true))

    expect(restored).toEqual({
      enabled: false,
      restorationStatus: 'ready',
      authority: 'visitor',
    })
  })
})
