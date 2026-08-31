import { createSlice } from '@reduxjs/toolkit'
import type {
  ExperienceMode,
  ExperienceState,
} from '../../../../components/shell/controls/experience/experienceTypes'
import { experienceModeCycled, storedExperienceRestored } from './experienceActions'

const NEXT_MODE: Readonly<Record<ExperienceMode, ExperienceMode>> = {
  cinematic: 'quiet',
  quiet: 'cinematic',
}

const initialState: ExperienceState = {
  mode: 'cinematic',
}

const experienceSlice = createSlice({
  name: 'experience',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(experienceModeCycled, (state) => {
        state.mode = NEXT_MODE[state.mode]
      })
      .addCase(storedExperienceRestored, (state, action) => {
        state.mode = action.payload ?? state.mode
      })
  },
})

export default experienceSlice.reducer
