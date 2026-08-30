import React from 'react';
import { Button, XStack } from 'tamagui';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { downloadTheme, loadTheme } from '../features/themeCustom/themeCustomSlice';
import { selectThemeMode } from '../features/themeToggle/themeToggleSlice';
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
      // themeToggleSlice adopts the custom theme on loadTheme.fulfilled, so no
      // follow-up setThemeMode: that second dispatch was what let the teardown
      // listener run against the stale mode.
      await dispatch(loadTheme()).unwrap();
    } catch (error) {
      // Cancelling the picker rejects; that is not worth logging as a failure.
      const message = error instanceof Error ? error.message : String(error);
      if (message !== 'Theme selection cancelled') {
        console.error('Failed to load theme:', message);
      }
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
