import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ThemeCustomState } from '../../data/interfaces';
import { apiSlice } from '../api/apiSlice';

// Both thunks drive the DOM (Blob, <a download>, <input type="file">). Those APIs
// do not exist on iOS/Android, where these previously threw a ReferenceError.
const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';

/** Name used for a user-supplied theme. */
export const CUSTOM_THEME_NAME = 'custom';

const CUSTOM_STYLE_SELECTOR = 'style[data-custom-theme]';

/** Variables the theme stylesheets define on the active `.theme-<name>` class. */
const THEME_VARIABLES = [
  '--background-color',
  '--foreground-color',
  '--text-color',
  '--accent-color',
  '--card-background',
] as const;

/** Removes any injected custom-theme stylesheet. Exported so theme changes can clean up. */
export const removeCustomThemeStyle = () => {
  if (!isWeb) return;
  document.querySelectorAll(CUSTOM_STYLE_SELECTOR).forEach((el) => el.remove());
};

/**
 * One export at a time. The bundle contains exactly one createObjectURL call
 * site -- this one -- so a report of ~15,000 live blob URLs per click means the
 * handler was entered repeatedly rather than looping internally. The guard makes
 * re-entry a no-op regardless of what triggers it.
 */
let exportInFlight = false;

export const downloadTheme = createAsyncThunk(
  'themeCustom/downloadTheme',
  async (themeName: string) => {
    if (!isWeb) {
      throw new Error('Theme download is only available on web');
    }
    if (exportInFlight) {
      throw new Error('Theme export already in progress');
    }
    exportInFlight = true;

    // Read the values the active theme actually resolves to. The template used
    // to hardcode light-theme hex codes, so downloading while "dark" was active
    // produced a file claiming --background: #ffffff -- actively misleading.
    const computed = window.getComputedStyle(document.body);
    const declarations = THEME_VARIABLES
      .map((name) => [name, computed.getPropertyValue(name).trim()] as const)
      .filter(([, value]) => value.length > 0)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join('\n');

    const cssTemplate = `/* Theme: Custom */
/* Based on: ${themeName} */
/* Exported from the live values of the "${themeName}" theme. */

.theme-${CUSTOM_THEME_NAME} {
${declarations || '  /* the active theme defined no variables */'}
}

body.theme-${CUSTOM_THEME_NAME} {
  background-color: var(--background-color);
  color: var(--text-color);
}

/* Add your custom styles here */
`;

    const url = window.URL.createObjectURL(new Blob([cssTemplate], { type: 'text/css' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'theme-custom.css';
    link.style.display = 'none';

    try {
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      // Deferred: revoking synchronously after click can cancel the download
      // in some browsers before it has read the blob. finally guarantees the
      // handle is released even if click() throws.
      setTimeout(() => window.URL.revokeObjectURL(url), 0);
      exportInFlight = false;
    }

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

            const style = document.createElement('style');
            style.textContent = css;
            // A stable marker, not a timestamped one: the generated name used to
            // leak into the UI as "Theme: custom-1788068942990" and into the
            // body class as theme-custom-<timestamp>.
            style.setAttribute('data-custom-theme', '');

            removeCustomThemeStyle();
            document.head.appendChild(style);

            resolve(CUSTOM_THEME_NAME);
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
  reducers: {
    customThemeCleared: (state) => {
      state.customThemeName = null;
    },
  },
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

export const { customThemeCleared } = themeCustomSlice.actions;
export const { selectCustomThemeName } = themeCustomSlice.selectors;
export default themeCustomSlice.reducer;
