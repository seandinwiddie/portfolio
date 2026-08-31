import { createSlice } from '@reduxjs/toolkit'
import type { DiagnosticsState } from '../../../../components/platform/observability/diagnostics/diagnosticsTypes'
import { diagnosticActionObserved, diagnosticsCleared } from './diagnosticsActions'

const LIMIT = 30

const initialState: DiagnosticsState = {
  entries: [],
  sequence: 0,
}

const diagnosticsSlice = createSlice({
  name: 'diagnostics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(diagnosticActionObserved, (state, { payload }) => {
        state.sequence += 1
        state.entries = [
          { id: state.sequence, type: payload.type, at: payload.at },
          ...state.entries,
        ].slice(0, LIMIT)
      })
      .addCase(diagnosticsCleared, (state) => {
        state.entries = []
      })
  },
})

export default diagnosticsSlice.reducer
