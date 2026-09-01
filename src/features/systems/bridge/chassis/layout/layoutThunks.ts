import React from 'react'
import { useFonts } from 'expo-font'
import { SplashScreen, usePathname } from 'expo-router'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import {
  selectLayoutReady,
  selectLayoutViewModel,
  type LayoutViewModel,
} from './layoutSelectors'

export const useLayoutComposition = (
  surface: 'dark' | 'light',
  themeReady: boolean
): LayoutViewModel => {
  const pathname = usePathname()
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({
      presentation: data?.presentation?.runtime.layout,
    }),
  })
  const [fontsLoaded, fontError] = useFonts({
    'Dank Mono': require('../../../../../../assets/fonts/DankMono-Regular.otf'),
    SpaceMono: require('../../../../../../assets/fonts/SpaceMono-Regular.ttf'),
  })

  const ready = selectLayoutReady({ fontsLoaded, fontError, themeReady })

  React.useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined)
  }, [ready])

  return { ready, ...selectLayoutViewModel(surface, pathname)(presentation) }
}
