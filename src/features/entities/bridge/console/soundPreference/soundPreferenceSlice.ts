import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type SoundPreferenceAuthority = 'default' | 'stored' | 'visitor'
export type SoundPreferenceRestorationStatus = 'pending' | 'ready'

export type SoundPreferenceState = Readonly<{
  enabled: boolean
  restorationStatus: SoundPreferenceRestorationStatus
  authority: SoundPreferenceAuthority
}>

export const initialSoundPreferenceState: SoundPreferenceState = {
  enabled: true,
  restorationStatus: 'pending',
  authority: 'default',
}

const soundPreferenceSlice = createSlice({
  name: 'soundPreference',
  initialState: initialSoundPreferenceState,
  reducers: {
    storedSoundPreferenceRestored: (state, action: PayloadAction<boolean | null>) => {
      const storageMayChoose = state.authority === 'default'
      const storedValueAvailable = action.payload !== null && storageMayChoose
      const restoredValue = action.payload ?? state.enabled

      state.enabled = storedValueAvailable ? restoredValue : state.enabled
      state.authority = storedValueAvailable ? 'stored' : state.authority
      state.restorationStatus = 'ready'
    },
    soundPreferenceToggled: (state) => {
      state.enabled = !state.enabled
      state.authority = 'visitor'
      state.restorationStatus = 'ready'
    },
  },
})

export const { soundPreferenceToggled, storedSoundPreferenceRestored } =
  soundPreferenceSlice.actions

export default soundPreferenceSlice.reducer
