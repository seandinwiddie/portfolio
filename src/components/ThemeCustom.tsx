import React from 'react';
import { Button, XStack } from 'tamagui';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { downloadTheme, loadTheme } from '../features/themeCustom/themeCustomSlice';
import { setThemeMode, selectThemeMode } from '../features/themeToggle/themeToggleSlice';
import { selectCustomThemeName } from '../features/themeCustom/themeCustomSlice';

const ThemeCustom: React.FC = () => {
  const currentTheme = useAppSelector(selectThemeMode);
  const customThemeName = useAppSelector(selectCustomThemeName);
  const dispatch = useAppDispatch();

  const handleDownloadTheme = async () => {
    dispatch(downloadTheme(currentTheme));
  };

  const handleLoadTheme = async () => {
    try {
      const newTheme = await dispatch(loadTheme()).unwrap();
      if (newTheme) {
        dispatch(setThemeMode(newTheme));
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <XStack space="$2">
      <Button onPress={handleDownloadTheme}>Download Theme</Button>
      <Button onPress={handleLoadTheme}>
        {customThemeName ? 'Update Custom Theme' : 'Load Custom Theme'}
      </Button>
    </XStack>
  );
};

export default ThemeCustom;
