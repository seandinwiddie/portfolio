import { createSlice } from '@reduxjs/toolkit'
import type { AmbientSceneState } from '../../../../components/shell/frame/ambientScene/ambientSceneTypes'
import {
  ambientSceneReceived,
  ambientSceneRequestFailed,
  ambientSceneRequestStarted,
} from './ambientSceneActions'

const initialState: AmbientSceneState = {
  world: null,
  loadState: 'pending',
}

const ambientSceneSlice = createSlice({
  name: 'ambientScene',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ambientSceneRequestStarted, (state) => {
        state.loadState = 'pending'
      })
      .addCase(
        ambientSceneReceived,
        (_state, { payload }): AmbientSceneState => ({
          world: payload,
          loadState: 'ready',
        })
      )
      .addCase(ambientSceneRequestFailed, (state) => {
        state.loadState = 'error'
      })
  },
  selectors: {
    selectAmbientSceneWorld: (state) => state.world,
    selectAmbientSceneLoadState: (state) => state.loadState,
  },
})

export const { selectAmbientSceneWorld, selectAmbientSceneLoadState } =
  ambientSceneSlice.selectors

export default ambientSceneSlice.reducer
