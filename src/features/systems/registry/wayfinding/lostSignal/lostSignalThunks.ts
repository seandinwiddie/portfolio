import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import {
  selectLostSignalViewModel,
  type LostSignalViewProps,
} from './lostSignalSelectors'

export const useLostSignalRoute = (): LostSignalViewProps => {
  const query = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError, isUninitialized }) => ({
      presentation: data?.presentation?.lostSignal,
      staleLabel: data?.presentation?.runtime.telemetry.values.stale,
      isLoading,
      isError,
      isUninitialized,
    }),
  })
  return {
    ...selectLostSignalViewModel(query.presentation),
    dataStatus: selectApiDocumentStatus(Boolean(query.presentation), query),
  }
}
