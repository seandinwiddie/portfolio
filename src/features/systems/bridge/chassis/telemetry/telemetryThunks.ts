import { selectThemeLabel } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../substrate/kernel/api/apiApi'
import { useAppSelector } from '../../../substrate/kernel/composition/compositionThunks'
import { selectTelemetryViewModel, type TelemetryViewProps } from './telemetrySelectors'

// The layout owns the single persistent GitHub refresh clock. Ten minutes
// matches the API resource TTL; route-specific consumers reuse this document.
export const GITHUB_REFRESH_INTERVAL_MS = 10 * 60 * 1000

export const useTelemetryComposition = (): TelemetryViewProps => {
  const presentation = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({
      telemetry: data?.presentation?.runtime.telemetry,
      customThemeLabel: data?.presentation?.runtime.theme.customLabel ?? '',
    }),
  })
  const theme = useAppSelector((state) =>
    selectThemeLabel(state, presentation.customThemeLabel)
  )
  const feed = useGetGithubSummaryQuery(undefined, {
    pollingInterval: GITHUB_REFRESH_INTERVAL_MS,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    selectFromResult: ({ data, isFetching, isError }) => ({
      hasData: Boolean(data),
      isPartial: Boolean(
        data?.partial ||
          data?.availability?.partial ||
          data?.availability?.state === 'partial'
      ),
      isStale: Boolean(
        data?.stale || data?.availability?.stale || data?.availability?.state === 'stale'
      ),
      isFetching,
      isError,
    }),
  })

  return selectTelemetryViewModel(theme, feed)(presentation.telemetry)
}
