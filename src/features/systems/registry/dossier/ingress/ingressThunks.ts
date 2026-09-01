import { Platform } from 'react-native'
import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import {
  selectInstallQrViewModel,
  selectIngressViewModelAt,
  type IngressViewProps,
} from './ingressSelectors'

export const useIngressRoute = (): IngressViewProps => {
  const { data } = useGetGithubSummaryQuery()
  const initialState = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data: dataState, isLoading, isError, isUninitialized }) => ({
      presentation: dataState?.presentation?.ingress,
      runtimePresentation: dataState?.presentation?.runtime.dossier,
      staleLabel: dataState?.presentation?.runtime.telemetry.values.stale,
      isLoading,
      isError,
      isUninitialized,
    }),
  })
  return {
    ...selectIngressViewModelAt(Date.now())(
      initialState.presentation,
      initialState.runtimePresentation
    )(data),
    dataStatus: selectApiDocumentStatus(Boolean(initialState.presentation), initialState),
    installQr: selectInstallQrViewModel(
      initialState.presentation?.install,
      Platform.OS === 'web'
    ),
  }
}
