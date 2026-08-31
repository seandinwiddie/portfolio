import { selectContributionVisualization } from '../../../../entities/shell/themes/themeSelection/themeSelectionSelectors'
import { useGetGithubSummaryQuery } from '../../../platform/foundation/api/apiApi'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import { selectProjectsViewModelAt, type ProjectsViewProps } from './projectsSelectors'

export const useProjectsRoute = (): ProjectsViewProps => {
  const query = useGetGithubSummaryQuery()
  const visualization = useAppSelector(selectContributionVisualization)

  return {
    ...selectProjectsViewModelAt(Date.now())(query.data, visualization),
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
