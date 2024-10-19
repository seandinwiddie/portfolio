import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AppData {
  brandName: string;
  description: string;
  iniTheme: string;
  portfolioFeatures: Array<{ id: string; title: string; description: string }>;
  appProcedures: Array<{ id: string; title: string; description: string }>;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getAppData: builder.query<AppData, void>({
      query: () => 'app-data',
    }),
  }),
});

export const { useGetAppDataQuery } = apiSlice;
