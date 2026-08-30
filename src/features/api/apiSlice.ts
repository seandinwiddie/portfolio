import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AppData, InitialStateResponse } from '../../data/schemas';
import localInitialState from '../../data/initialState.json';

// Default to the deployed API in every environment. Previously __DEV__ forced
// http://localhost:3000, so running the app locally always failed to load any
// content unless you happened to be running that API on that exact port.
// Point EXPO_PUBLIC_API_URL at a local API to override.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.sdin.dev';

const fallback = localInitialState as unknown as InitialStateResponse;

// The API and the bundled initialState.json share a shape, so the local copy
// backfills any field the response omits.
const normalize = (response: Partial<InitialStateResponse>): AppData => ({
  portfolioFeatures: response.portfolioFeatures ?? fallback.portfolioFeatures,
  appProcedures: response.appProcedures ?? fallback.appProcedures,
  brandName: response.brandName ?? fallback.brandName,
  description: response.description ?? fallback.description,
  iniTheme: response.iniTheme ?? fallback.iniTheme,
  // Preserved deliberately: themeCustomSlice and bodySlice both match on these,
  // and the previous transformResponse dropped them so those cases never fired.
  themeCustom: response.themeCustom ?? fallback.themeCustom,
  brandNameLoading: { isLoading: false },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getInitialState: builder.query<AppData, void>({
      // queryFn (rather than query + transformResponse) so an unreachable API
      // still resolves with the bundled content instead of rendering a blank page.
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery('/data');

        if (result.error) {
          console.warn('getInitialState: API unreachable, using bundled data', result.error);
          return { data: normalize({}) };
        }

        return { data: normalize(result.data as Partial<InitialStateResponse>) };
      },
    }),
    getBrandName: builder.query<string, void>({
      query: () => '/brandName',
    }),
    getDescription: builder.query<string, void>({
      query: () => '/description',
    }),
  }),
});

export const {
  useGetInitialStateQuery,
  useGetBrandNameQuery,
  useGetDescriptionQuery,
} = apiSlice;
