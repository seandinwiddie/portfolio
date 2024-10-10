import { configureStore } from '@reduxjs/toolkit';
import themeToggleReducer from '../features/themeToggle/themeToggleSlice';
import navReducer from '../features/nav/navSlice';
import bodyReducer from '../features/body/bodySlice';
import { api } from '../features/api/apiSlice';

export const store = configureStore({
  reducer: {
    themeToggle: themeToggleReducer,
    nav: navReducer,
    body: bodyReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
