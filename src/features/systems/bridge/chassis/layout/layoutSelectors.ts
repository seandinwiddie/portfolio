import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import type { StationKey } from '../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimePresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'

export type LayoutViewModel = {
  readonly ready: boolean
  readonly pathname: string
  readonly workspaceLabel: string
  readonly skipLabel: string
  readonly navigationTheme: typeof DarkTheme
  readonly statusBarStyle: 'dark-content' | 'light-content'
}

export type LayoutReadinessInput = Readonly<{
  fontsLoaded: boolean
  fontError: Error | null
  themeReady: boolean
}>

export const selectLayoutReady = ({
  fontsLoaded,
  fontError,
  themeReady,
}: LayoutReadinessInput): boolean => themeReady && (fontsLoaded || fontError !== null)

const STATION_BY_PATH: Readonly<Record<string, StationKey>> = {
  '/': 'ingress',
  '/nexus': 'nexus',
  '/dossier': 'dossier',
  '/missions': 'missions',
  '/telemetry': 'telemetry',
}

export const selectWorkspaceLabel = (
  pathname: string,
  presentation: RuntimePresentation['layout'] | undefined
): string =>
  presentation?.workspaces[STATION_BY_PATH[pathname] ?? 'lostSignal'] ?? 'Content'

export const selectLayoutViewModel =
  (surface: 'dark' | 'light', pathname: string) =>
  (
    presentation: RuntimePresentation['layout'] | undefined
  ): Omit<LayoutViewModel, 'ready'> => ({
    pathname,
    workspaceLabel: selectWorkspaceLabel(pathname, presentation),
    skipLabel: presentation?.skipLabel ?? 'Skip to content',
    navigationTheme: surface === 'light' ? DefaultTheme : DarkTheme,
    statusBarStyle: surface === 'light' ? 'dark-content' : 'light-content',
  })
