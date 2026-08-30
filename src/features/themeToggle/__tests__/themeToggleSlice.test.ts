import themeToggleReducer, {
  DEFAULT_THEME,
  setThemeMode,
  cycleTheme,
  fetchAvailableThemes,
  restoreTheme,
} from '../themeToggleSlice';
import type { ThemeToggleState } from '../../../data/interfaces';

describe('themeToggleSlice', () => {
  // Explicitly typed: the bare object literal widened `status` to `string`, which
  // is not assignable to the slice's union type.
  const initialState: ThemeToggleState = {
    mode: 'light',
    themes: [],
    status: 'idle',
    error: null,
    hasStoredPreference: false,
  };

  it('should handle initial state', () => {
    expect(themeToggleReducer(undefined, { type: 'unknown' })).toEqual({
      ...initialState,
      mode: DEFAULT_THEME,
    });
  });

  it('should handle setThemeMode', () => {
    const actual = themeToggleReducer(initialState, setThemeMode('dark'));
    expect(actual.mode).toEqual('dark');
  });

  it('should not produce an undefined mode when cycling with no themes', () => {
    const actual = themeToggleReducer(initialState, cycleTheme());
    expect(actual.mode).toEqual('light');
  });

  it('should handle fetchAvailableThemes.fulfilled', () => {
    const themes = ['light', 'dark', 'mirage'];
    const action = { type: fetchAvailableThemes.fulfilled.type, payload: themes };
    const state = themeToggleReducer(initialState, action);
    expect(state.themes).toEqual(themes);
    expect(state.status).toEqual('succeeded');
  });
});

describe('theme persistence', () => {
  it('restores a stored theme so it survives a page load', () => {
    const state = themeToggleReducer(
      { mode: 'light', themes: ['light', 'dark'], status: 'succeeded', error: null, hasStoredPreference: false },
      { type: restoreTheme.fulfilled.type, payload: 'dark' }
    );
    expect(state.mode).toBe('dark');
  });

  it('keeps the current theme when nothing was stored', () => {
    const state = themeToggleReducer(
      { mode: 'mirage', themes: ['light', 'mirage'], status: 'succeeded', error: null, hasStoredPreference: false },
      { type: restoreTheme.fulfilled.type, payload: null }
    );
    expect(state.mode).toBe('mirage');
  });
});

describe('default theme', () => {
  it('ships mirage as the initial mode', () => {
    expect(DEFAULT_THEME).toBe('mirage');
    expect(themeToggleReducer(undefined, { type: 'unknown' }).mode).toBe('mirage');
  });

  it('prefers mirage over the first alphabetical theme when the mode is unknown', () => {
    const state = themeToggleReducer(
      { mode: 'nonexistent', themes: [], status: 'idle', error: null, hasStoredPreference: false },
      { type: fetchAvailableThemes.fulfilled.type, payload: ['dark', 'dracula', 'light', 'mirage', 'neon'] }
    );
    expect(state.mode).toBe('mirage');
  });

  it("lets a visitor's saved choice outrank the API's iniTheme", () => {
    const chosen = themeToggleReducer(
      { mode: 'light', themes: ['light', 'mirage'], status: 'succeeded', error: null, hasStoredPreference: false },
      { type: restoreTheme.fulfilled.type, payload: 'neon' }
    );
    expect(chosen.hasStoredPreference).toBe(true);

    const afterApi = themeToggleReducer(chosen, {
      type: 'api/executeQuery/fulfilled',
      payload: { iniTheme: 'mirage' },
      meta: { arg: { endpointName: 'getInitialState' }, requestId: 'x', requestStatus: 'fulfilled' },
    });
    expect(afterApi.mode).toBe('neon');
  });
});
