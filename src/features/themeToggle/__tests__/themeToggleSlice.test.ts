import themeToggleReducer, {
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
  };

  it('should handle initial state', () => {
    expect(themeToggleReducer(undefined, { type: 'unknown' })).toEqual(initialState);
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
      { mode: 'light', themes: ['light', 'dark'], status: 'succeeded', error: null },
      { type: restoreTheme.fulfilled.type, payload: 'dark' }
    );
    expect(state.mode).toBe('dark');
  });

  it('keeps the current theme when nothing was stored', () => {
    const state = themeToggleReducer(
      { mode: 'mirage', themes: ['light', 'mirage'], status: 'succeeded', error: null },
      { type: restoreTheme.fulfilled.type, payload: null }
    );
    expect(state.mode).toBe('mirage');
  });
});
