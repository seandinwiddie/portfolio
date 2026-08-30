import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeCustomState } from '../../data/interfaces';
import { apiSlice } from '../api/apiSlice';

// Both thunks drive the DOM (Blob, <a download>, <input type="file">). Those APIs
// do not exist on iOS/Android, where these previously threw a ReferenceError.
const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';

export const downloadTheme = createAsyncThunk(
  'themeCustom/downloadTheme',
  async (themeName: string) => {
    if (!isWeb) {
      throw new Error('Theme download is only available on web');
    }

    // Create a basic CSS template
    const cssTemplate = `
/* Theme: Custom */
/* Based on: ${themeName} */

:root {
  --background: #ffffff;
  --color: #000000;
  --primary: #3498db;
  --secondary: #2ecc71;
  --accent: #e74c3c;
  
  /* Add more custom variables as needed */
}

/* Add your custom styles here */
`;

    // Create a Blob with the CSS content
    const blob = new Blob([cssTemplate], { type: 'text/css' });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'theme-custom.css';

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return 'theme-custom.css';
  }
);

export const loadTheme = createAsyncThunk(
  'themeCustom/loadTheme',
  async () => {
    if (!isWeb) {
      throw new Error('Theme loading is only available on web');
    }

    return new Promise<string>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.css';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const css = e.target?.result as string;
            const themeName = 'custom-' + Date.now(); // Generate a unique name
            
            // Create a new style element
            const style = document.createElement('style');
            style.textContent = css;
            style.setAttribute('data-theme', themeName);
            
            // Remove any existing custom theme
            document.querySelectorAll('style[data-theme^="custom-"]').forEach(el => el.remove());
            
            // Add the new style to the document
            document.head.appendChild(style);
            
            resolve(themeName);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.oncancel = () => reject(new Error('Theme selection cancelled'));
      input.click();
    });
  }
);

const initialState: ThemeCustomState = { customThemeName: null };

const themeCustomSlice = createSlice({
  name: 'themeCustom',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Reducers stay pure -- the console.log calls that used to live in these
      // cases were side effects running on every dispatch.
      .addCase(loadTheme.fulfilled, (state, action) => {
        state.customThemeName = action.payload;
      })
      .addMatcher(
        apiSlice.endpoints.getInitialState.matchFulfilled,
        (state, { payload }) => {
          state.customThemeName =
            payload?.themeCustom?.customThemeName ?? state.customThemeName;
        }
      );
  },
  selectors: {
    selectCustomThemeName: (state) => state.customThemeName,
  },
});

export const { selectCustomThemeName } = themeCustomSlice.selectors;

export default themeCustomSlice.reducer;
