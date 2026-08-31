import { DarkTheme, DefaultTheme } from '@react-navigation/native'

export type LayoutViewModel = {
  readonly ready: boolean
  readonly pathname: string
  readonly showNavigation: boolean
  readonly navigationTheme: typeof DarkTheme
  readonly statusBarStyle: 'dark-content' | 'light-content'
}

export const selectLayoutReady = (
  fontsLoaded: boolean,
  fontError: Error | null
): boolean => fontsLoaded || fontError !== null

export const selectLayoutViewModel = (
  surface: 'dark' | 'light',
  pathname: string
): Omit<LayoutViewModel, 'ready'> => ({
  pathname,
  showNavigation: pathname !== '/',
  navigationTheme: surface === 'light' ? DefaultTheme : DarkTheme,
  statusBarStyle: surface === 'light' ? 'dark-content' : 'light-content',
})
