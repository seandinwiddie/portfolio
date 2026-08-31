import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ThemeCustomStatus = 'idle' | 'importing' | 'ready' | 'exporting' | 'failed'

export type ThemeCustomState = Readonly<{
  customThemeName: 'custom' | null
  status: ThemeCustomStatus
  error: string | null
}>

export const initialThemeCustomState: ThemeCustomState = {
  customThemeName: null,
  status: 'idle',
  error: null,
}

const themeCustomSlice = createSlice({
  name: 'themeCustom',
  initialState: initialThemeCustomState,
  reducers: {
    customThemeImportStarted: (state) => {
      state.status = 'importing'
      state.error = null
    },
    customThemeLoaded: (state) => {
      state.customThemeName = 'custom'
      state.status = 'ready'
      state.error = null
    },
    customThemeImportFailed: (state, action: PayloadAction<string>) => {
      state.status = 'failed'
      state.error = action.payload
    },
    customThemeExportStarted: (state) => {
      state.status = 'exporting'
      state.error = null
    },
    customThemeExported: (state) => {
      state.status = state.customThemeName === null ? 'idle' : 'ready'
    },
    customThemeExportFailed: (state, action: PayloadAction<string>) => {
      state.status = 'failed'
      state.error = action.payload
    },
    customThemeCleared: (state) => {
      state.customThemeName = null
      state.status = 'idle'
      state.error = null
    },
  },
})

export const {
  customThemeCleared,
  customThemeExported,
  customThemeExportFailed,
  customThemeExportStarted,
  customThemeImportFailed,
  customThemeImportStarted,
  customThemeLoaded,
} = themeCustomSlice.actions

export default themeCustomSlice.reducer
