import themeToggleReducer, {
  setThemeMode,
  fetchAvailableThemes,
} from '../themeToggleSlice';

describe('themeToggleSlice', () => {
  const initialState = {
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

  it('should handle fetchAvailableThemes.fulfilled', () => {
    const themes = ['light', 'dark', 'mirage'];
    const action = { type: fetchAvailableThemes.fulfilled.type, payload: themes };
    const state = themeToggleReducer(initialState, action);
    expect(state.themes).toEqual(themes);
    expect(state.status).toEqual('succeeded');
  });
});
