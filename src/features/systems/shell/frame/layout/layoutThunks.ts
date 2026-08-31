import React from 'react'
import { useFonts } from 'expo-font'
import { SplashScreen, usePathname } from 'expo-router'
import { restoreExperience } from '../../controls/experience/experienceThunks'
import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../platform/foundation/api/apiApi'
import { useAppDispatch } from '../../../platform/foundation/composition/compositionThunks'
import {
  selectLayoutReady,
  selectLayoutViewModel,
  type LayoutViewModel,
} from './layoutSelectors'

export const useLayoutComposition = (surface: 'dark' | 'light'): LayoutViewModel => {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const [fontsLoaded, fontError] = useFonts({
    'Dank Mono': require('../../../../../../assets/fonts/DankMono-Regular.otf'),
    SpaceMono: require('../../../../../../assets/fonts/SpaceMono-Regular.ttf'),
  })

  useGetInitialStateQuery()
  useGetGithubSummaryQuery()

  React.useEffect(() => {
    dispatch(restoreExperience())
  }, [dispatch])

  const ready = selectLayoutReady(fontsLoaded, fontError)

  React.useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined)
  }, [ready])

  return { ready, ...selectLayoutViewModel(surface, pathname) }
}
