import { useCallback } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useGetGithubSummaryQuery } from '../../../platform/foundation/api/apiApi'
import {
  selectInstallQrViewModel,
  selectWelcomeViewModelAt,
  type WelcomeHref,
  type WelcomeViewProps,
} from './welcomeSelectors'

export const useWelcomeRoute = (): WelcomeViewProps => {
  const router = useRouter()
  const { data } = useGetGithubSummaryQuery()
  const onNavigate = useCallback((href: WelcomeHref) => router.push(href), [router])

  return {
    ...selectWelcomeViewModelAt(Date.now())(data),
    installQr: selectInstallQrViewModel(
      process.env.EXPO_PUBLIC_NATIVE_APP_URL,
      Platform.OS === 'web'
    ),
    onNavigate,
  }
}
