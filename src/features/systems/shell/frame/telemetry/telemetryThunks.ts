import { selectExperienceMode } from '../../../../entities/shell/controls/experience/experienceSelectors'
import { selectThemeLabel } from '../../../../entities/shell/themes/themeSelection/themeSelectionSelectors'
import { useGetGithubSummaryQuery } from '../../../platform/foundation/api/apiApi'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import { selectTelemetryViewModel, type TelemetryViewProps } from './telemetrySelectors'

export const useTelemetryComposition = (): TelemetryViewProps => {
  const theme = useAppSelector(selectThemeLabel)
  const experience = useAppSelector(selectExperienceMode)
  const { data, isFetching, isError } = useGetGithubSummaryQuery()

  return selectTelemetryViewModel(theme, {
    experience,
    feed: { hasData: Boolean(data), isFetching, isError },
  })
}
