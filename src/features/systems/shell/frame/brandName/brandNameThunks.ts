import {
  selectBrandName,
  selectBrandNameLoading,
} from '../../../../entities/shell/frame/brandName/brandNameSlice'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import { selectBrandNameViewModel, type BrandNameViewProps } from './brandNameSelectors'

export const useBrandNameComposition = (): BrandNameViewProps =>
  selectBrandNameViewModel(
    useAppSelector(selectBrandName),
    useAppSelector(selectBrandNameLoading)
  )
