import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.sdin.dev';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getInitialState: builder.query({
      query: () => '/data',
      transformResponse: (response) => {
        console.log('Raw API response:', response);
        return {
          portfolioFeatures: response.portfolioFeatures || [],
          appProcedures: response.appProcedures || [],
          brandName: response.brandName,
          description: response.description
        };
      },
    }),
    getBrandName: builder.query({
      query: () => '/brandName',
    }),
    getDescription: builder.query({
      query: () => '/description',
    }),
  }),
});

export const {
  useGetInitialStateQuery,
  useGetBrandNameQuery,
  useGetDescriptionQuery,
} = apiSlice;
