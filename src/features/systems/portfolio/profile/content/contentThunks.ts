import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import { selectContentViewModel, type ContentViewProps } from './contentSelectors'

export const useContentRoute = (): ContentViewProps =>
  useAppSelector(selectContentViewModel)
