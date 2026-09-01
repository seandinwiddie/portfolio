import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import { selectBrandNameViewModel, type BrandNameViewProps } from './brandNameSelectors'

export const useBrandNameComposition = (): BrandNameViewProps => {
  const { brandName, isLoading } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading: queryIsLoading, isUninitialized }) => ({
      brandName: data?.brandName ?? '',
      isLoading: queryIsLoading || isUninitialized,
    }),
  })

  return selectBrandNameViewModel(brandName, isLoading)
}
