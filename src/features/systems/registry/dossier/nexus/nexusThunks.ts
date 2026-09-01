import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import { selectNexusViewModel, type NexusViewProps } from './nexusSelectors'

export const useNexusRoute = (): NexusViewProps => {
  const query = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError, isUninitialized }) => ({
      presentation: data?.presentation?.nexus,
      staleLabel: data?.presentation?.runtime.telemetry.values.stale,
      isLoading,
      isError,
      isUninitialized,
    }),
  })

  return {
    ...selectNexusViewModel(query.presentation),
    dataStatus: selectApiDocumentStatus(Boolean(query.presentation), query),
  }
}
