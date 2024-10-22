import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ThemeToggle from '../ThemeToggle';
import { setThemeMode } from '../../features/themeToggle/themeToggleSlice';

const mockStore = configureStore([]);

describe('ThemeToggle', () => {
  it('displays the current theme and toggles to the next theme when clicked', () => {
    const initialState = {
      themeToggle: {
        mode: 'light',
        themes: ['light', 'dark', 'mirage'],
      },
    };
    const store = mockStore(initialState);

    const { getByText } = render(
      <Provider store={store}>
        <ThemeToggle />
      </Provider>
    );

    const button = getByText('Theme: light');
    fireEvent.click(button);

    const actions = store.getActions();
    expect(actions).toEqual([setThemeMode('dark')]);
  });
});
