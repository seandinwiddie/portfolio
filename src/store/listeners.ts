import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  cycleTheme,
  setThemeMode,
  fetchAvailableThemes,
  restoreTheme,
} from '../features/themeToggle/themeToggleSlice';
import {
  CUSTOM_THEME_NAME,
  loadTheme,
  removeCustomThemeStyle,
} from '../features/themeCustom/themeCustomSlice';
import { saveStoredTheme } from '../features/themeToggle/themeStorage';
import type { RootState, AppDispatch } from './index';

export const listenerMiddleware = createListenerMiddleware();

// Typed once here rather than casting getState() at each callsite.
const startAppListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

/** A theme that came from the bundled stylesheets, not from a user-supplied file. */
const isBuiltInTheme = (mode: string): boolean =>
  mode.length > 0 && mode !== CUSTOM_THEME_NAME;

// A custom theme's CSS is injected at runtime and never persisted, so a built-in
// theme is the only thing worth saving -- and switching to one is exactly when
// the injected stylesheet should be torn down.
const adoptBuiltInTheme = (mode: string): Promise<void> => {
  removeCustomThemeStyle();
  return saveStoredTheme(mode);
};

// Reactive side effects belong here rather than in reducers (which must stay
// pure) or in components (which would re-run them on every mount).
startAppListening({
  matcher: isAnyOf(
    setThemeMode,
    cycleTheme,
    fetchAvailableThemes.fulfilled,
    restoreTheme.fulfilled,
    loadTheme.fulfilled
  ),
  effect: async (_action, listenerApi) => {
    const { mode } = listenerApi.getState().themeToggle;
    return isBuiltInTheme(mode) ? adoptBuiltInTheme(mode) : Promise.resolve();
  },
});
