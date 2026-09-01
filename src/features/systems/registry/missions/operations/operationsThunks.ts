import { selectContributionVisualization } from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import { useAppSelector } from '../../../substrate/kernel/composition/compositionThunks'
import { selectMissionsViewModelAt, type MissionsViewProps } from './operationsSelectors'

export const useMissionsRoute = (): MissionsViewProps => {
  const query = useGetGithubSummaryQuery()
  const presentation = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError, isUninitialized }) => ({
      data: data?.presentation?.missions,
      signalLattice: data?.presentation?.runtime.signalLattice,
      staleLabel: data?.presentation?.runtime.telemetry.values.stale,
      isLoading,
      isError,
      isUninitialized,
    }),
  })
  const visualization = useAppSelector(selectContributionVisualization)
  const retainedTransportFailure =
    (query.isError && Boolean(query.data)) ||
    (presentation.isError && Boolean(presentation.data))

  return {
    ...selectMissionsViewModelAt(Date.now())(
      presentation.data,
      presentation.signalLattice
    )({
      summary: query.data,
      visualization,
      retainedTransportFailure,
    }),
    dataStatus: selectApiDocumentStatus(Boolean(presentation.data), presentation),
    isLoading:
      query.isLoading ||
      query.isUninitialized ||
      presentation.isLoading ||
      presentation.isUninitialized,
    isError:
      (query.isError && !query.data) || (presentation.isError && !presentation.data),
  }
}
