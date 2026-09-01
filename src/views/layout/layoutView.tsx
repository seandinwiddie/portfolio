import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import { StatusBar } from 'react-native'
import { Anchor, TamaguiProvider, YStack } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import config from '../../../tamagui.config'
import { store } from '../../store'
import { useThemeCustomController } from '../../features/systems/bridge/spectrum/themeCustom/themeCustomThunks'
import { useThemeSelectionController } from '../../features/systems/bridge/spectrum/themeSelection/themeSelectionThunks'
import { useAmbientSceneComposition } from '../../features/systems/bridge/chassis/ambientScene/ambientSceneThunks'
import { useArchiveControlComposition } from '../../features/systems/bridge/console/archiveControl/archiveControlThunks'
import { useButtonFxComposition } from '../../features/systems/bridge/console/buttonFx/buttonFxThunks'
import { useBrandNameComposition } from '../../features/systems/bridge/chassis/brandName/brandNameThunks'
import { useUtilityRailComposition } from '../../features/systems/bridge/chassis/utilityRail/utilityRailThunks'
import { useLayoutComposition } from '../../features/systems/bridge/chassis/layout/layoutThunks'
import { useNavigationComposition } from '../../features/systems/bridge/chassis/navigation/navigationThunks'
import { useTelemetryComposition } from '../../features/systems/bridge/chassis/telemetry/telemetryThunks'
import { useErrorBoundaryComposition } from '../../features/systems/substrate/ui/presentation/errorBoundary/errorBoundaryThunks'
import ErrorBoundary from '../aperture/errorBoundary/errorBoundaryView'
import AmbientScene from '../bridge/chassis/ambientScene/ambientSceneView'
import ArchiveControl from '../bridge/console/archiveControl/archiveControlView'
import BrandName from '../bridge/chassis/brandName/brandNameView'
import UtilityRail from '../bridge/chassis/utilityRail/utilityRailView'
import Nav from '../bridge/chassis/navigation/navigationView'
import Telemetry from '../bridge/chassis/telemetry/telemetryView'
import ThemeCustom from '../bridge/console/themeCustom/themeCustomView'
import ThemeToggle from '../bridge/console/themeToggle/themeToggleView'

export const unstable_settings = {
  initialRouteName: 'index',
}

const useRouteStageFocus = (pathname: string): void => {
  const previousPathname = React.useRef(pathname)

  React.useEffect(() => {
    const routeChanged = previousPathname.current !== pathname
    previousPathname.current = pathname
    const frame = routeChanged
      ? globalThis.requestAnimationFrame?.(() =>
          globalThis.document
            ?.getElementById('system-workspace')
            ?.focus({ preventScroll: true })
        )
      : undefined

    return frame === undefined
      ? undefined
      : () => globalThis.cancelAnimationFrame?.(frame)
  }, [pathname])
}

const LayoutContent: React.FC = () => {
  const theme = useThemeSelectionController()
  const customTheme = useThemeCustomController()
  const layout = useLayoutComposition(theme.surface, theme.ready)
  const navigation = useNavigationComposition()
  const brandName = useBrandNameComposition()
  const utilityRail = useUtilityRailComposition()
  const ambientScene = useAmbientSceneComposition()
  const telemetry = useTelemetryComposition()
  const archiveControl = useArchiveControlComposition()
  useButtonFxComposition()
  useRouteStageFocus(layout.pathname)

  return (
    <ThemeProvider value={layout.navigationTheme}>
      <TamaguiProvider config={config} defaultTheme={theme.mode}>
        <ToastProvider swipeDirection="horizontal" duration={6000} native={[]}>
          <YStack flex={1} className="orbital-bridge crt-grain system-bridge">
            <Anchor href="#system-workspace" className="system-skip-link">
              {layout.skipLabel}
            </Anchor>
            <AmbientScene {...ambientScene} />
            <StatusBar barStyle={layout.statusBarStyle} />
            <Nav
              {...navigation}
              controls={{
                brand: <BrandName {...brandName} />,
                themeToggle: <ThemeToggle {...theme.toggle} />,
                themeCustom: <ThemeCustom {...customTheme} />,
              }}
            />
            <YStack className="system-workspace" flex={1}>
              <YStack className="system-telemetry-region">
                <Telemetry {...telemetry} />
              </YStack>
              <YStack
                key={layout.pathname}
                id="system-workspace"
                tabIndex={-1}
                tag="main"
                aria-label={layout.workspaceLabel}
                flex={1}
                className="route-stage system-route-region"
              >
                <Slot />
              </YStack>
              <YStack className="system-utility-rail-region">
                <UtilityRail {...utilityRail} />
              </YStack>
            </YStack>
          </YStack>
          <ArchiveControl {...archiveControl} />
          <ToastViewport top="$8" left={0} right={0} />
        </ToastProvider>
      </TamaguiProvider>
    </ThemeProvider>
  )
}

const LayoutBoundary: React.FC = () => {
  const fallback = useErrorBoundaryComposition()

  return (
    <ErrorBoundary fallback={fallback}>
      <LayoutContent />
    </ErrorBoundary>
  )
}

const Layout: React.FC = () => (
  <ReduxProvider store={store}>
    <LayoutBoundary />
  </ReduxProvider>
)

export default Layout
