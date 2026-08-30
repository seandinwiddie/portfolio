import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import themeToggleReducer from '../features/themeToggle/themeToggleSlice';
import themeCustomReducer from '../features/themeCustom/themeCustomSlice';
import brandNameReducer from '../features/brandName/brandNameSlice';
import navReducer from '../features/nav/navSlice';
import bodyReducer from '../features/body/bodySlice';
import { apiSlice } from '../features/api/apiSlice';

const rootReducer = combineReducers({
  themeToggle: themeToggleReducer,
  themeCustom: themeCustomReducer,
  brandName: brandNameReducer,
  nav: navReducer,
  body: bodyReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** Factory so tests build the same store the app runs, with no duplicated wiring. */
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

export const store = makeStore();

setupListeners(store.dispatch);

// NOTE: the initial fetch is dispatched from the root layout, not here. Firing it
// as an import side effect ran it twice (once on import, once on mount) and made
// the module impossible to import from a test without hitting the network.

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
