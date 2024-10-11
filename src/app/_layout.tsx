import '../../tamagui-web.css'

import { useEffect } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { Provider } from './Provider'
import { useTheme, Theme } from 'tamagui'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from './store'
import { useAppSelector } from './hooks'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  initialRouteName: 'index',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <Providers>
      <RootLayoutInner />
    </Providers>
  )
}

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ReduxProvider store={store}>
    <Provider>{children}</Provider>
  </ReduxProvider>
)

function RootLayoutInner() {
  const colorScheme = useColorScheme()
  const themeMode = useAppSelector((state) => state.themeToggle.mode)

  const getTheme = () => {
    switch (themeMode) {
      case 'light':
        return DefaultTheme
      case 'dark':
        return DarkTheme
      default:
        return colorScheme === 'dark' ? DarkTheme : DefaultTheme
    }
  }

  const currentTheme = getTheme()
  const isDarkTheme = currentTheme === DarkTheme

  return (
    <ThemeProvider value={currentTheme}>
      <Theme name={isDarkTheme ? 'dark' : 'light'}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </Theme>
    </ThemeProvider>
  )
}
