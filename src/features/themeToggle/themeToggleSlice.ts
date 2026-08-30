import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeToggleState } from '../../data/interfaces';
import { loadStoredTheme } from './themeStorage';
import { apiSlice } from '../api/apiSlice';
import { CUSTOM_THEME_NAME, loadTheme } from '../themeCustom/themeCustomSlice';

/** Ships as the default look. The API's `iniTheme` can override it. */
export const DEFAULT_THEME = 'mirage';

// Fallback for non-browser environments (notably the static web export, which
// prerenders in Node). This previously listed only 3 of the 5 theme files, so the
// prerendered markup disagreed with the hydrated client.
const FALLBACK_THEMES = ['dark', 'dracula', 'light', 'mirage', 'neon'];

/** Only `light` is a light ground; dracula, mirage and neon are all dark. */
const LIGHT_THEMES = new Set(['light']);

const nameFromKey = (key: string): string => key.match(/theme-(.+)\.css$/)?.[1] ?? '';

// Function to dynamically fetch theme names
const getThemeNames = async (): Promise<string[]> => {
  // NOTE: `require.context(...)` must stay a literal call expression -- Metro
  // resolves it statically at build time, so aliasing it to a variable breaks it.
  if (typeof window === 'undefined') {
    return FALLBACK_THEMES;
  }
  const themeContext = require.context('../../styles/themes', false, /theme-.*\.css$/);
  return themeContext.keys().map(nameFromKey).filter(Boolean);
};

export const fetchAvailableThemes = createAsyncThunk(
  'themeToggle/fetchAvailableThemes',
  getThemeNames
);

/** Rehydrates the previously chosen theme, so it survives a page load. */
export const restoreTheme = createAsyncThunk('themeToggle/restoreTheme', loadStoredTheme);

const initialState: ThemeToggleState = {
  mode: DEFAULT_THEME,
  themes: [],
  status: 'idle',
  error: null,
  hasStoredPreference: false,
};

const themeToggleSlice = createSlice({
  name: 'themeToggle',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<string>) => {
      state.mode = action.payload;
    },
    cycleTheme: (state) => {
      const { themes, mode } = state;
      // Guarded as an expression: `% 0` on an empty list produced NaN, so the
      // mode became undefined and the body class read "theme-undefined".
      state.mode =
        themes.length === 0
          ? mode
          : themes[(themes.indexOf(mode) + 1) % themes.length];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableThemes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAvailableThemes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.themes = action.payload;
        state.mode = action.payload.includes(state.mode)
          ? state.mode
          : action.payload.find((name) => name === DEFAULT_THEME) ?? action.payload[0] ?? DEFAULT_THEME;
      })
      .addCase(restoreTheme.fulfilled, (state, action) => {
        // If the stored theme is not in the discovered list,
        // fetchAvailableThemes.fulfilled corrects it.
        state.hasStoredPreference = action.payload !== null;
        state.mode = action.payload ?? state.mode;
      })
      // Adopting the custom theme belongs in the same transition that loads it.
      // Previously ThemeCustom dispatched setThemeMode *after* loadTheme
      // resolved, so at loadTheme.fulfilled the mode was still the old built-in
      // one -- and the persistence listener, seeing a built-in theme, promptly
      // removed the <style> tag that had just been injected. The theme name
      // changed and the CSS never applied.
      .addCase(loadTheme.fulfilled, (state) => {
        state.mode = CUSTOM_THEME_NAME;
      })
      .addCase(fetchAvailableThemes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch themes';
      })
      // All addCase calls must precede addMatcher; RTK rejects the reverse.
      .addMatcher(
        apiSlice.endpoints.getInitialState.matchFulfilled,
        (state, { payload }) => {
          // `iniTheme` has always been in the payload but nothing read it.
          // An explicit choice the visitor already made outranks it.
          state.mode = state.hasStoredPreference ? state.mode : payload.iniTheme ?? state.mode;
        }
      );
  },
  selectors: {
    selectThemeMode: (state) => state.mode,
    selectThemes: (state) => state.themes,
    selectThemeStatus: (state) => state.status,
    // Charts pick their ramp from the ground's polarity, not from a guess.
    selectSurface: (state): 'light' | 'dark' =>
      LIGHT_THEMES.has(state.mode) ? 'light' : 'dark',
  },
});

export const { setThemeMode, cycleTheme } = themeToggleSlice.actions;
export const { selectThemeMode, selectThemes, selectThemeStatus, selectSurface } =
  themeToggleSlice.selectors;
export default themeToggleSlice.reducer;
