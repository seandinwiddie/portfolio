import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../store';
import { TamaguiProvider, Theme, YStack, type ThemeName } from 'tamagui';
import config from '../../tamagui.config';  // Import the config
import { useFonts } from 'expo-font';
import { SplashScreen, Slot, usePathname } from 'expo-router';
import { StatusBar, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { fetchAvailableThemes, selectThemeMode } from '../features/themeToggle/themeToggleSlice';
import { apiSlice } from '../features/api/apiSlice';
import ErrorBoundary from '../components/ErrorBoundary';

// process.env.TAMAGUI_DISABLE_NO_THEME_WARNING = '1';

// Global stylesheets (font-face, body + card rules the themes build on)
import '../styles/fonts.css';
import '../styles/body.css';
import '../styles/app.css';
import '../styles/nav.css';

// Import all theme CSS files
import '../styles/themes/theme-light.css';
import '../styles/themes/theme-dark.css';
import '../styles/themes/theme-dracula.css';
import '../styles/themes/theme-neon.css';
import '../styles/themes/theme-mirage.css';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const pathname = usePathname();

  const [fontsLoaded, fontError] = useFonts({
    'Dank Mono': require('../../assets/fonts/DankMono-Regular.otf'),
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Kick off the initial data load. Components render their own pending states,
  // so this never blocks the shell -- a slow or unreachable API must not leave
  // the user staring at a bare "Loading..." string.
  useEffect(() => {
    dispatch(fetchAvailableThemes());
    const subscription = dispatch(apiSlice.endpoints.getInitialState.initiate());
    return () => subscription.unsubscribe();
  }, [dispatch]);

  // The splash screen is hidden manually because preventAutoHideAsync() ran above.
  // Hiding on fontError too, otherwise a bad font file wedges the app on the splash.
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (typeof document !== 'undefined' && themeMode) {
      document.body.className = `theme-${themeMode}`;
    }
  }, [themeMode]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Theme names are discovered at runtime from src/styles/themes, so this is a
  // string until it reaches Tamagui's ThemeName union.
  const currentTheme = (themeMode || (colorScheme === 'dark' ? 'dark' : 'light')) as ThemeName;

  return (
    <ThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TamaguiProvider config={config} defaultTheme={currentTheme}>
        <Theme name={currentTheme}>
          <ToastProvider swipeDirection="horizontal" duration={6000} native={[]}>
            <YStack flex={1}>
              <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
              {pathname !== '/' && <Nav />}
              <YStack flex={1}>
                <Slot />
              </YStack>
              <Footer />
            </YStack>
            <ToastViewport top="$8" left={0} right={0} />
          </ToastProvider>
        </Theme>
      </TamaguiProvider>
    </ThemeProvider>
  );
}

export default function Layout() {
  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <RootLayoutNav />
      </ReduxProvider>
    </ErrorBoundary>
  );
}
