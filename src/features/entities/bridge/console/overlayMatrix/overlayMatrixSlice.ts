import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  OverlayMatrixId,
  OverlayMatrixState,
} from '../../../../components/bridge/console/overlayMatrix/overlayMatrixTypes'

export const initialOverlayMatrixState: OverlayMatrixState = { active: null }

const overlayMatrixSlice = createSlice({
  name: 'overlayMatrix',
  initialState: initialOverlayMatrixState,
  reducers: {
    overlayRequested: (state, action: PayloadAction<OverlayMatrixId>) => {
      state.active = action.payload
    },
    overlayDismissed: (state, action: PayloadAction<OverlayMatrixId>) => {
      state.active = state.active === action.payload ? null : state.active
    },
    overlayToggled: (state, action: PayloadAction<OverlayMatrixId>) => {
      state.active = state.active === action.payload ? null : action.payload
    },
  },
})

export const { overlayDismissed, overlayRequested, overlayToggled } =
  overlayMatrixSlice.actions

export default overlayMatrixSlice.reducer
