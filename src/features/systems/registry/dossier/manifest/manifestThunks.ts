import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../substrate/kernel/api/apiApi'
import { selectApiDocumentStatus } from '../../../substrate/kernel/api/apiSelectors'
import { selectDossierViewModelAt, type DossierViewProps } from './manifestSelectors'

export const useDossierRoute = (): DossierViewProps => {
  const initialState = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError, isUninitialized }) => ({
      dossier: data?.dossier ?? null,
      presentation: data?.presentation?.runtime.dossier,
      staleLabel: data?.presentation?.runtime.telemetry.values.stale,
      isLoading,
      isError,
      isUninitialized,
    }),
  })
  const { data } = useGetGithubSummaryQuery()

  return {
    ...selectDossierViewModelAt(Date.now())(initialState.presentation)(
      initialState.dossier,
      data
    ),
    dataStatus: selectApiDocumentStatus(Boolean(initialState.dossier), initialState),
  }
}
