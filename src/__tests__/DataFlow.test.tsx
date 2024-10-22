import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { apiSlice } from '../features/api/apiSlice';
import themeToggleReducer from '../features/themeToggle/themeToggleSlice';
import brandNameReducer from '../features/brandName/brandNameSlice';
import bodyReducer from '../features/body/bodySlice';
import App from '../App';
import { TamaguiProvider } from 'tamagui';

describe('Data Flow', () => {
  it('fetches data from initialState.json and populates the Redux store', async () => {
    const store = configureStore({
      reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        themeToggle: themeToggleReducer,
        brandName: brandNameReducer,
        body: bodyReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brandName: 'Test Brand',
        description: 'Test Description',
        iniTheme: 'light',
        portfolioFeatures: [{ id: '1', title: 'Test Feature', description: 'Test Feature Description' }],
        appProcedures: [{ id: '1', title: 'Test Procedure', description: 'Test Procedure Description' }],
      }),
    });

    render(
      <TamaguiProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </TamaguiProvider>
    );

    // Dispatch the action to fetch initial state
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate());

    await waitFor(() => {
      const state = store.getState();
      expect(state.brandName.value).toBe('Test Brand');
      expect(state.body.description).toBe('Test Description');
      expect(state.themeToggle.mode).toBe('light');
      expect(state.body.portfolioFeatures).toHaveLength(1);
      expect(state.body.appProcedures).toHaveLength(1);
    }, { timeout: 10000 }); // Increase timeout to 10 seconds
  });
});
