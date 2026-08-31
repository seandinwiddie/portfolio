import { selectAbout } from '../../../../entities/portfolio/profile/body/bodySlice'
import { useGetGithubSummaryQuery } from '../../../platform/foundation/api/apiApi'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import { selectAboutViewModelAt, type AboutViewProps } from './aboutSelectors'

export const useAboutRoute = (): AboutViewProps => {
  const about = useAppSelector(selectAbout)
  const { data } = useGetGithubSummaryQuery()

  return selectAboutViewModelAt(Date.now())(about, data)
}
