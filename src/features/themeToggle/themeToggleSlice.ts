import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeToggleState } from '../../data/interfaces';
import { loadStoredTheme } from './themeStorage';

// Fallback for non-browser environments (notably the static web export, which
// prerenders in Node). This previously listed only 3 of the 5 theme files, so the
// prerendered markup disagreed with the hydrated client.
const FALLBACK_THEMES = ['dark', 'dracula', 'light', 'mirage', 'neon'];

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
  mode: 'light',
  themes: [],
  status: 'idle',
  error: null,
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
          : action.payload[0] ?? 'light';
      })
      .addCase(restoreTheme.fulfilled, (state, action) => {
        // If the stored theme is not in the discovered list,
        // fetchAvailableThemes.fulfilled corrects it.
        state.mode = action.payload ?? state.mode;
      })
      .addCase(fetchAvailableThemes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch themes';
      });
  },
  selectors: {
    selectThemeMode: (state) => state.mode,
    selectThemes: (state) => state.themes,
    selectThemeStatus: (state) => state.status,
  },
});

export const { setThemeMode, cycleTheme } = themeToggleSlice.actions;
export const { selectThemeMode, selectThemes, selectThemeStatus } =
  themeToggleSlice.selectors;
export default themeToggleSlice.reducer;
