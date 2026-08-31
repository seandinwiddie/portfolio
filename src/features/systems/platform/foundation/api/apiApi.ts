import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  ApiStatus,
  AppData,
  GithubCommits,
  GithubSummary,
  InitialStateResponse,
} from '../../../../components/platform/foundation/api/apiTypes'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.sdin.dev'
export const API_TIMEOUT_MS = 8_000

const normalize = (response: InitialStateResponse): AppData => ({
  portfolioFeatures: response.portfolioFeatures,
  appProcedures: response.appProcedures,
  brandName: response.brandName,
  description: response.description,
  iniTheme: response.iniTheme,
  themeCustom: response.themeCustom,
  about: response.about ?? null,
  ambientScene: response.ambientScene,
  brandNameLoading: { isLoading: false },
  source: 'network',
})

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL, timeout: API_TIMEOUT_MS }),
  tagTypes: [
    'InitialState',
    'GithubSummary',
    'GithubCommits',
    'ApiStatus',
    'BrandName',
    'Description',
  ],
  endpoints: (builder) => ({
    getInitialState: builder.query<AppData, void>({
      query: () => '/data',
      transformResponse: normalize,
      providesTags: ['InitialState'],
    }),
    getGithubSummary: builder.query<GithubSummary, void>({
      query: () => '/github',
      providesTags: ['GithubSummary'],
    }),
    getGithubCommits: builder.query<GithubCommits, void>({
      query: () => '/github/commits',
      providesTags: ['GithubCommits'],
    }),
    getApiStatus: builder.query<ApiStatus, void>({
      query: () => '/status',
      providesTags: ['ApiStatus'],
    }),
    getBrandName: builder.query<string, void>({
      query: () => '/brandName',
      transformResponse: (response: { brandName: string }) => response.brandName,
      providesTags: ['BrandName'],
    }),
    getDescription: builder.query<string, void>({
      query: () => '/description',
      transformResponse: (response: { description: string }) => response.description,
      providesTags: ['Description'],
    }),
  }),
})

export const {
  useGetInitialStateQuery,
  useGetGithubSummaryQuery,
  useGetGithubCommitsQuery,
  useGetApiStatusQuery,
  useGetBrandNameQuery,
  useGetDescriptionQuery,
} = apiSlice
