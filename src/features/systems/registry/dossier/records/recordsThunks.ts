import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import { selectRecordsViewModel, type RecordsViewProps } from './recordsSelectors'

export const useRecordsComposition = (): RecordsViewProps => {
  const { registryCapabilities, operatingProtocols, presentation } =
    useGetInitialStateQuery(undefined, {
      selectFromResult: ({ data }) => ({
        registryCapabilities: data?.registryCapabilities ?? [],
        operatingProtocols: data?.operatingProtocols ?? [],
        presentation: data?.presentation?.runtime.dossier,
      }),
    })

  return selectRecordsViewModel(registryCapabilities, operatingProtocols)(presentation)
}
