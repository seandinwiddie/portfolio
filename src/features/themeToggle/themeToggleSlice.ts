import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';

export type ThemeMode = string;

interface ThemeState {
  mode: ThemeMode;
  availableThemes: ThemeMode[];
}

const themeToggleSlice = createSlice({
  name: 'themeToggle',
  initialState: {} as ThemeState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        state.mode = payload.themeMode;
        state.availableThemes = payload.availableThemes;
      }
    );
  },
});

export const { setThemeMode } = themeToggleSlice.actions;
export default themeToggleSlice.reducer;