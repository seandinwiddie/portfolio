import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeToggleState } from '../../data/schemas';

// Function to dynamically fetch theme names
const getThemeNames = async () => {
  if (typeof window !== 'undefined') {
    const themeContext = require.context('../../styles/themes', false, /theme-.*\.css$/);
    return themeContext.keys().map(key => {
      const match = key.match(/theme-(.+)\.css$/);
      return match ? match[1] : '';
    }).filter(Boolean);
  }
  return [];
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
    mode: '',
    themes: [],
    status: 'idle',
    error: null
  } as ThemeToggleState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<string>) => {
      state.mode = action.payload;
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
        if (!state.mode) {
          state.mode = action.payload[0] || 'light';
        }
      })
      .addCase(fetchAvailableThemes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch themes';
      });
  },
});

export const { setThemeMode } = themeToggleSlice.actions;
export default themeToggleSlice.reducer;
