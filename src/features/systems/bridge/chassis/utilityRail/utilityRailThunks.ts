import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import {
  selectUtilityRailViewModel,
  type UtilityRailViewProps,
} from './utilityRailSelectors'

export const useUtilityRailComposition = (): UtilityRailViewProps => {
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ presentation: data?.presentation?.utilityRail }),
  })

  return selectUtilityRailViewModel(presentation)
}
