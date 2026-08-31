import type React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { ThemeProvider } from '@react-navigation/native'
import { Slot } from 'expo-router'
import { StatusBar } from 'react-native'
import { TamaguiProvider, YStack } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import config from '../../../tamagui.config'
import { store } from '../../store'
import { useThemeCustomController } from '../../features/systems/shell/themes/themeCustom/themeCustomThunks'
import { useThemeSelectionController } from '../../features/systems/shell/themes/themeSelection/themeSelectionThunks'
import { useAmbientSceneComposition } from '../../features/systems/shell/frame/ambientScene/ambientSceneThunks'
import { useArchiveControlComposition } from '../../features/systems/shell/controls/archiveControl/archiveControlThunks'
import { useBrandNameComposition } from '../../features/systems/shell/frame/brandName/brandNameThunks'
import { useExperienceToggleComposition } from '../../features/systems/shell/controls/experience/experienceThunks'
import { useLayoutComposition } from '../../features/systems/shell/frame/layout/layoutThunks'
import { useNavigationComposition } from '../../features/systems/shell/frame/navigation/navigationThunks'
import { useTelemetryComposition } from '../../features/systems/shell/frame/telemetry/telemetryThunks'
import ErrorBoundary from '../shared/errorBoundary/errorBoundaryView'
import AmbientScene from '../shell/frame/ambientScene/ambientSceneView'
import ArchiveControl from '../shell/controls/archiveControl/archiveControlView'
import BrandName from '../shell/frame/brandName/brandNameView'
import ExperienceToggle from '../shell/controls/experienceToggle/experienceToggleView'
import Footer from '../shell/frame/footer/footerView'
import Nav from '../shell/frame/navigation/navigationView'
import Telemetry from '../shell/frame/telemetry/telemetryView'
import ThemeCustom from '../shell/controls/themeCustom/themeCustomView'
import ThemeToggle from '../shell/controls/themeToggle/themeToggleView'

export const unstable_settings = {
  initialRouteName: 'index',
}

const LayoutContent: React.FC = () => {
  const theme = useThemeSelectionController()
  const customTheme = useThemeCustomController()
  const experienceToggle = useExperienceToggleComposition()
  const layout = useLayoutComposition(theme.surface)
  const navigation = useNavigationComposition()
  const brandName = useBrandNameComposition()
  const ambientScene = useAmbientSceneComposition()
  const telemetry = useTelemetryComposition()
  const archiveControl = useArchiveControlComposition()

  return layout.ready ? (
    <ThemeProvider value={layout.navigationTheme}>
      <TamaguiProvider config={config} defaultTheme={theme.mode}>
        <ToastProvider swipeDirection="horizontal" duration={6000} native={[]}>
          <YStack flex={1} className="orbital-shell crt-grain">
            <AmbientScene {...ambientScene} />
            <StatusBar barStyle={layout.statusBarStyle} />
            {layout.showNavigation ? (
              <Nav
                {...navigation}
                controls={{
                  brand: <BrandName {...brandName} />,
                  themeToggle: <ThemeToggle {...theme.toggle} />,
                  themeCustom: <ThemeCustom {...customTheme} />,
                  experienceToggle: <ExperienceToggle {...experienceToggle} />,
                }}
              />
            ) : null}
            <Telemetry {...telemetry} />
            <YStack key={layout.pathname} tag="main" flex={1} className="route-stage">
              <Slot />
            </YStack>
            <Footer />
          </YStack>
          <ArchiveControl {...archiveControl} />
          <ToastViewport top="$8" left={0} right={0} />
        </ToastProvider>
      </TamaguiProvider>
    </ThemeProvider>
  ) : null
}

const Layout: React.FC = () => (
  <ErrorBoundary>
    <ReduxProvider store={store}>
      <LayoutContent />
    </ReduxProvider>
  </ErrorBoundary>
)

export default Layout
