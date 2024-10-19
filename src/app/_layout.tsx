import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { TamaguiProvider, Theme } from 'tamagui';
import { useFonts } from 'expo-font';
import { SplashScreen, Slot } from 'expo-router';
import { StatusBar, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from './hooks';
import { config } from '../../tamagui.config';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import Nav from '../components/Nav';
import { fetchAvailableThemes, setThemeMode } from '../features/themeToggle/themeToggleSlice';
import { apiSlice } from '../features/api/apiSlice';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.themeToggle?.mode);

  useEffect(() => {
    dispatch(fetchAvailableThemes());
    dispatch(apiSlice.endpoints.getAppData.initiate());
  }, [dispatch]);

  useEffect(() => {
    if (typeof document !== 'undefined' && themeMode) {
      const sanitizedThemeName = themeMode.replace(/[^a-zA-Z0-9-_]/g, '');
      document.body.className = `theme-${sanitizedThemeName}`;

      // Remove existing theme stylesheets
      document.querySelectorAll('link[data-theme]').forEach(el => el.remove());

      // Load the current theme stylesheet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/styles/themes/theme-${sanitizedThemeName}.css`;
      link.setAttribute('data-theme', sanitizedThemeName);
      document.head.appendChild(link);
    }
  }, [themeMode]);

  const currentTheme = themeMode || (colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <ThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TamaguiProvider config={config} defaultTheme={currentTheme}>
        <ToastProvider swipeDirection="horizontal" duration={6000} native={[]}>
          <Theme name={currentTheme as any}>
            <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
            <Nav />
            <Slot />
            <ToastViewport top="$8" left={0} right={0} />
          </Theme>
        </ToastProvider>
      </TamaguiProvider>
    </ThemeProvider>
  );
}

const AppLayout = () => {
  return (
    <ReduxProvider store={store}>
      <RootLayoutNav />
    </ReduxProvider>
  );
};

export default AppLayout;
