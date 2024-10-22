import React, { useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { TamaguiProvider, Theme } from 'tamagui';
import config from '../../tamagui.config';  // Import the config
import { useFonts } from 'expo-font';
import { SplashScreen, Slot } from 'expo-router';
import { StatusBar, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from './hooks';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import Nav from '../components/Nav';
import { fetchAvailableThemes } from '../features/themeToggle/themeToggleSlice';
import { apiSlice } from '../features/api/apiSlice';
import { Text } from 'tamagui';
import ErrorBoundary from '../components/ErrorBoundary';

// process.env.TAMAGUI_DISABLE_NO_THEME_WARNING = '1';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.themeToggle?.mode);
  const bodyState = useAppSelector((state) => state.body);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchAvailableThemes());
        const result = await dispatch(apiSlice.endpoints.getInitialState.initiate());
        console.log('API response:', result);
        console.log('Body state after API call:', bodyState);
      } catch (error) {
        console.error('Error fetching initial state:', error);
      } finally {
        console.log('Initial data fetched');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  if (isLoading) {
    return <Text>Loading... Please wait.</Text>;
  }

  const currentTheme = themeMode || (colorScheme === 'dark' ? 'dark' : 'light');
  console.log('Current theme:', currentTheme);
  console.log('Body state in render:', bodyState);

  return (
    <ThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TamaguiProvider config={config} defaultTheme={currentTheme}>
        <Theme name={currentTheme}>
          <ToastProvider swipeDirection="horizontal" duration={6000} native={[]}>
            <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
            <Nav />
            <Slot />
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
