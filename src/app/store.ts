import { configureStore } from '@reduxjs/toolkit';
import themeToggleReducer from '../features/themeToggle/themeToggleSlice';
import themeCustomReducer from '../features/themeCustom/themeCustomSlice';
import navReducer from '../features/nav/navSlice';
import { apiSlice } from '../features/api/apiSlice';

export const store = configureStore({
  reducer: {
    themeToggle: themeToggleReducer,
    themeCustom: themeCustomReducer,
    nav: navReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
