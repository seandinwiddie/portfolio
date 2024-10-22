import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeToggleState } from '../../data/interfaces';

// Function to dynamically fetch theme names
const getThemeNames = async () => {
  if (typeof window !== 'undefined') {
    const themeContext = require.context('../../styles/themes', false, /theme-.*\.css$/);
    return themeContext.keys().map(key => {
      const match = key.match(/theme-(.+)\.css$/);
      return match ? match[1] : '';
    }).filter(Boolean);
  }
  return ['light', 'dark', 'mirage']; // Fallback for non-browser environments
};

export const fetchAvailableThemes = createAsyncThunk(
  'themeToggle/fetchAvailableThemes',
  async () => {
    const themeNames = await getThemeNames();
    return themeNames;
  }
);

const themeToggleSlice = createSlice({
  name: 'themeToggle',
  initialState: {
    mode: 'light',
    themes: [],
    status: 'idle',
    error: null
  } as ThemeToggleState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<string>) => {
      state.mode = action.payload;
    },
    cycleTheme: (state) => {
      const currentIndex = state.themes.indexOf(state.mode);
      const nextIndex = (currentIndex + 1) % state.themes.length;
      state.mode = state.themes[nextIndex];
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
        if (!state.mode || !action.payload.includes(state.mode)) {
          state.mode = action.payload[0] || 'light';
        }
      })
      .addCase(fetchAvailableThemes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch themes';
      });
  },
});

export const { setThemeMode, cycleTheme } = themeToggleSlice.actions;
export default themeToggleSlice.reducer;
