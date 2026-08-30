import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import config from '../../../tamagui.config';
import { makeStore, type RootState } from '../../store';

/**
 * Builds a real store rather than a mock one. redux-mock-store cannot run
 * reducers, so assertions against it only ever proved which actions were
 * dispatched -- never that the resulting state was right.
 */
export const makeTestStore = (preloadedState?: Partial<RootState>) =>
  makeStore(preloadedState);

export const renderWithProviders = (
  ui: React.ReactElement,
  { store = makeTestStore() } = {}
) => ({
  store,
  ...render(
    <TamaguiProvider config={config} defaultTheme="light">
      <Provider store={store}>{ui}</Provider>
    </TamaguiProvider>
  ),
});
