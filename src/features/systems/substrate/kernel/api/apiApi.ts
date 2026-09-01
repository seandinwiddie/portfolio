import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  ApiStatus,
  AppData,
  GithubCommits,
  GithubSummary,
  InitialStateResponse,
} from '../../../../components/substrate/kernel/api/apiTypes'
import type {
  PublicObservatory,
  PublicPresence,
} from '../../../../components/registry/observatory/signalArray/signalArrayTypes'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.sdin.dev'
export const API_TIMEOUT_MS = 8_000

const normalize = (response: InitialStateResponse): AppData => ({
  registryCapabilities: response.registryCapabilities,
  operatingProtocols: response.operatingProtocols,
  brandName: response.brandName,
  description: response.description,
  iniTheme: response.iniTheme,
  themeCustom: response.themeCustom,
  dossier: response.dossier ?? null,
  ambientScene: response.ambientScene,
  presentation: response.presentation,
  source: 'network',
})

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL, timeout: API_TIMEOUT_MS }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'InitialState',
    'GithubSummary',
    'GithubCommits',
    'ApiStatus',
    'Observatory',
    'Presence',
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
    getObservatory: builder.query<PublicObservatory, void>({
      query: () => '/observatory',
      providesTags: ['Observatory'],
    }),
    getPresence: builder.query<PublicPresence, void>({
      query: () => '/presence',
      providesTags: ['Presence'],
    }),
  }),
})

export const {
  useGetInitialStateQuery,
  useGetGithubSummaryQuery,
  useGetGithubCommitsQuery,
  useGetApiStatusQuery,
  useGetObservatoryQuery,
  useGetPresenceQuery,
} = apiSlice
