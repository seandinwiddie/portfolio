import type { StationKey } from '../../../../../components/substrate/kernel/api/apiTypes'
import { useGetInitialStateQuery } from '../../../kernel/api/apiApi'
import {
  selectSignalMetaViewModel,
  type SignalMetaViewProps,
} from './signalMetaSelectors'

export const useSignalMetaComposition = (route: StationKey): SignalMetaViewProps => {
  const { metadata } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ metadata: data?.presentation?.metadata }),
  })

  return selectSignalMetaViewModel(metadata, route)
}
