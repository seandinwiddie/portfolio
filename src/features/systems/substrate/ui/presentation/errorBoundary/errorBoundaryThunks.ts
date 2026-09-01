import { useGetInitialStateQuery } from '../../../kernel/api/apiApi'
import {
  selectErrorBoundaryFallback,
  type ErrorBoundaryFallbackViewProps,
} from './errorBoundarySelectors'

export const useErrorBoundaryComposition = (): ErrorBoundaryFallbackViewProps => {
  const presentation = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({
      data: data?.presentation?.runtime.errorBoundary,
    }),
  })

  return selectErrorBoundaryFallback(presentation.data)
}
