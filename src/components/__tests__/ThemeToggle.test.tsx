import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import ThemeToggle from '../ThemeToggle';
import { makeTestStore, renderWithProviders } from '../../features/utils/renderWithProviders';

describe('ThemeToggle', () => {
  it('displays the current theme and advances to the next one when pressed', () => {
    const store = makeTestStore({
      themeToggle: { mode: 'light', themes: ['light', 'dark', 'mirage'], status: 'succeeded', error: null, hasStoredPreference: false },
    });

    const { getByTestId, getByText } = renderWithProviders(<ThemeToggle />, { store });

    expect(getByText('light')).toBeTruthy();
    fireEvent.press(getByTestId('theme-toggle'));

    // The component dispatches cycleTheme, not setThemeMode -- the old test
    // asserted an action this component never dispatches.
    expect(store.getState().themeToggle.mode).toBe('dark');
  });

  it('does not break when no themes have loaded yet', () => {
    const store = makeTestStore({
      themeToggle: { mode: 'light', themes: [], status: 'succeeded', error: null, hasStoredPreference: false },
    });

    const { getByTestId } = renderWithProviders(<ThemeToggle />, { store });
    fireEvent.press(getByTestId('theme-toggle'));

    // Previously `% 0` produced NaN and the mode became undefined.
    expect(store.getState().themeToggle.mode).toBe('light');
  });
});
