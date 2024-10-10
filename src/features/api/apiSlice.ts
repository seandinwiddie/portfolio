import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import initialState from '../../data/initialState.json';

interface AppData {
  brandName: string;
  description: string;
  themeMode: string;
  availableThemes: string[];
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  endpoints: (builder) => ({
    getAppData: builder.query<AppData, void>({
      queryFn: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: initialState });
          }, 1000);
        });
      },
    }),
  }),
});

export const { useGetAppDataQuery } = api;
