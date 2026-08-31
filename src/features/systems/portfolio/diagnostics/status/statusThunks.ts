import { useWindowDimensions } from 'react-native'
import { selectBrandName } from '../../../../entities/shell/frame/brandName/brandNameSlice'
import { selectDataSource } from '../../../../entities/portfolio/profile/body/bodySlice'
import { selectActionLog } from '../../../../entities/platform/observability/diagnostics/diagnosticsSelectors'
import { selectNavBrandName } from '../../../../entities/shell/frame/navigation/navigationSlice'
import {
  selectThemeLabel,
  selectThemeMode,
  selectThemes,
  selectThemeSource,
  selectThemeStatus,
} from '../../../../entities/shell/themes/themeSelection/themeSelectionSelectors'
import { useReducedMotion } from '../../../../../utils/useReducedMotion'
import {
  useGetApiStatusQuery,
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../platform/foundation/api/apiApi'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import {
  selectLegacyStatusViewModel,
  selectStatusViewModel,
  type LegacyStatusViewProps,
  type StatusViewProps,
} from './statusSelectors'

export const useStatusRoute = (): StatusViewProps => {
  const brandName = useAppSelector(selectBrandName)
  const source = useAppSelector(selectDataSource)
  const themeStatus = useAppSelector(selectThemeStatus)
  const themeLabel = useAppSelector(selectThemeLabel)
  const themeSource = useAppSelector(selectThemeSource)
  const themes = useAppSelector(selectThemes)
  const actions = useAppSelector(selectActionLog)
  const github = useGetGithubSummaryQuery()
  const api = useGetApiStatusQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
  })
  const reducedMotion = useReducedMotion()
  const viewport = useWindowDimensions()

  return selectStatusViewModel({
    brandName,
    source,
    themeStatus,
    themeLabel,
    themeSource,
    themes,
    actions,
    api: {
      data: api.data,
      isError: api.isError,
      startedTimeStamp: api.startedTimeStamp,
      fulfilledTimeStamp: api.fulfilledTimeStamp,
    },
    github: {
      data: github.data,
      isFetching: github.isFetching,
      isError: github.isError,
    },
    reducedMotion,
    viewport,
  })
}

export const useLegacyStatusRoute = (): LegacyStatusViewProps => {
  const query = useGetInitialStateQuery()
  const themeMode = useAppSelector(selectThemeMode)
  const brandName = useAppSelector(selectNavBrandName)

  return selectLegacyStatusViewModel({
    isLoading: query.isLoading,
    isError: query.isError,
    themeMode,
    brandName,
  })
}
