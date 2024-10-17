import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import initialState from '../../data/initialState.json';

interface PortfolioFeature {
  title: string;
  description: string;
}

interface AppData {
  brandName: string;
  description: string;
  iniTheme: string;
  themes: string[];
  portfolioFeatures: PortfolioFeature[];
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
    getAppData: builder.query<AppData, void>({
      queryFn: () => {
        return { data: initialState as AppData };
      },
    }),
  }),
});

export const { useGetAppDataQuery } = api;
