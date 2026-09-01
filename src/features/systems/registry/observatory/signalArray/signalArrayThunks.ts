import { selectContributionVisualization } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
  useGetObservatoryQuery,
  useGetPresenceQuery,
} from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import { useAppSelector } from '../../../substrate/kernel/composition/compositionThunks'
import {
  selectObservatoryViewModel,
  type ObservatoryViewProps,
} from './signalArraySelectors'

const PUBLIC_SIGNAL_POLL_MS = 60_000
const liveQueryOptions = {
  pollingInterval: PUBLIC_SIGNAL_POLL_MS,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
} as const

export const useObservatoryComposition = (): ObservatoryViewProps => {
  const visualization = useAppSelector(selectContributionVisualization)
  const initialState = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError, isUninitialized }) => ({
      presentation: data?.presentation?.observatory,
      staleLabel: data?.presentation?.runtime.telemetry.values.stale,
      isLoading,
      isError,
      isUninitialized,
    }),
  })
  const observatory = useGetObservatoryQuery(undefined, {
    ...liveQueryOptions,
    selectFromResult: ({ data, isLoading, isFetching, isError, isUninitialized }) => ({
      data,
      isLoading,
      isFetching,
      isError,
      isUninitialized,
    }),
  })
  const presence = useGetPresenceQuery(undefined, {
    ...liveQueryOptions,
    selectFromResult: ({ data, isLoading, isFetching, isError, isUninitialized }) => ({
      data,
      isLoading,
      isFetching,
      isError,
      isUninitialized,
    }),
  })
  const github = useGetGithubSummaryQuery(undefined, {
    selectFromResult: ({ data, isLoading, isFetching, isError, isUninitialized }) => ({
      data,
      isLoading,
      isFetching,
      isError,
      isUninitialized,
    }),
  })

  return selectObservatoryViewModel({
    presentation: initialState.presentation,
    dataStatus: selectApiDocumentStatus(Boolean(initialState.presentation), initialState),
    observatory: observatory.data,
    observatoryPending:
      observatory.isLoading || observatory.isFetching || observatory.isUninitialized,
    observatoryError: observatory.isError,
    presence: presence.data,
    presencePending:
      presence.isLoading || presence.isFetching || presence.isUninitialized,
    presenceError: presence.isError,
    github: github.data,
    githubPending: github.isLoading || github.isFetching || github.isUninitialized,
    githubError: github.isError,
    visualization,
  })
}
