import { useWindowDimensions } from 'react-native'
import { selectActionLog } from '../../../../entities/substrate/observability/diagnostics/diagnosticsSelectors'
import {
  selectThemeLabel,
  selectThemeMode,
  selectThemes,
  selectThemeSource,
  selectThemeStatus,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import { useReducedMotion } from '../../../../../utils/useReducedMotion'
import {
  useGetApiStatusQuery,
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import { useAppSelector } from '../../../substrate/kernel/composition/compositionThunks'
import {
  selectApiDataSource,
  selectTelemetryDeckViewModel,
  selectTelemetryViewModel,
  type TelemetryDeckViewProps,
  type TelemetryViewProps,
} from './diagnosticsSelectors'
import { EMPTY_TELEMETRY_PRESENTATION } from './fallback/fallbackSelectors'

export const useTelemetryRoute = (): TelemetryViewProps => {
  const initialState = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isError, isLoading, isUninitialized }) => ({
      brandName: data?.brandName ?? '',
      source: selectApiDataSource(Boolean(data), isError),
      presentation: data?.presentation?.runtime.telemetry ?? EMPTY_TELEMETRY_PRESENTATION,
      customThemeLabel: data?.presentation?.runtime.theme.customLabel ?? '',
      hasPresentation: Boolean(data?.presentation?.runtime.telemetry),
      staleLabel: data?.presentation?.runtime.telemetry.values.stale,
      isError,
      isLoading,
      isUninitialized,
    }),
  })
  const themeStatus = useAppSelector(selectThemeStatus)
  const themeLabel = useAppSelector((state) =>
    selectThemeLabel(state, initialState.customThemeLabel)
  )
  const themeSource = useAppSelector(selectThemeSource)
  const themes = useAppSelector(selectThemes)
  const actions = useAppSelector(selectActionLog)
  const github = useGetGithubSummaryQuery()
  const api = useGetApiStatusQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  })
  const reducedMotion = useReducedMotion()
  const viewport = useWindowDimensions()

  return {
    ...selectTelemetryViewModel({
      brandName: initialState.brandName,
      source: initialState.source,
      themeStatus,
      themeLabel,
      themeSource,
      themes,
      actions,
      api: {
        data: api.data,
        isError: api.isError,
        startedTimeStamp: api.startedTimeStamp,
        fulfilledTimeStamp: api.fulfilledTimeStamp,
      },
      github: {
        data: github.data,
        isFetching: github.isFetching,
        isError: github.isError,
      },
      reducedMotion,
      viewport,
      presentation: initialState.presentation,
    }),
    dataStatus: selectApiDocumentStatus(initialState.hasPresentation, initialState),
  }
}

export const useTelemetryDeckComposition = (): TelemetryDeckViewProps => {
  const query = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError, isUninitialized }) => ({
      brandName: data?.brandName ?? '',
      presentation: data?.presentation?.runtime.telemetry ?? EMPTY_TELEMETRY_PRESENTATION,
      isLoading: isLoading || isUninitialized,
      isError,
    }),
  })
  const themeMode = useAppSelector(selectThemeMode)

  return selectTelemetryDeckViewModel({
    isLoading: query.isLoading,
    isError: query.isError,
    themeMode,
    brandName: query.brandName,
    presentation: query.presentation,
  })
}
