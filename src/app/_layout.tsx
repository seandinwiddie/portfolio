import '../../tamagui-web.css'
import '../styles/body.css'
import '../styles/fonts.css'
import '../styles/app.css'
import '../styles/nav.css'
import '../styles/theme-light.css'
import '../styles/theme-dark.css'
import '../styles/theme-mirage.css'
import '../styles/theme-neon.css'

import { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { Provider } from './Provider'
import { YStack, Theme } from 'tamagui'
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
  const [fontsLoaded] = useFonts({
    'Dank Mono': require('../../assets/fonts/DankMono-Regular.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <ReduxProvider store={store}>
      <Provider>
        <RootLayoutInner />
      </Provider>
    </ReduxProvider>
  )
}

function RootLayoutInner() {
  const themeMode = useAppSelector((state) => state.themeToggle?.mode) || 'mirage';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = `theme-${themeMode}`;
    }
  }, [themeMode]);

  return (
    <ThemeProvider value={themeMode === 'dark' ? DarkTheme : DefaultTheme}>
      <Theme name={themeMode as any}>
        <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
        <YStack f={1}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </YStack>
      </Theme>
    </ThemeProvider>
  );
}
