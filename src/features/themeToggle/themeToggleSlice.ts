import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';

export type ThemeMode = string;

interface ThemeState {
  mode: ThemeMode;
  themes: ThemeMode[];
}

const themeToggleSlice = createSlice({
  name: 'themeToggle',
  initialState: {
    mode: 'mirage',
    themes: [],
  } as ThemeState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        state.mode = payload.iniTheme;
        state.themes = payload.themes;
      }
    );
  },
});

export const { setThemeMode } = themeToggleSlice.actions;
export default themeToggleSlice.reducer;
