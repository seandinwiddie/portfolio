import React from 'react';
import { Button } from 'tamagui';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setThemeMode, ThemeMode } from '../features/themeToggle/themeToggleSlice';

const ThemeToggle: React.FC = () => {
  const themeMode = useAppSelector((state) => state.themeToggle.mode);
  const availableThemes = useAppSelector((state) => state.themeToggle.availableThemes);
  const dispatch = useAppDispatch();

  const toggleTheme = () => {
    const currentIndex = availableThemes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    dispatch(setThemeMode(availableThemes[nextIndex]));
  };

  return (
    <Button onPress={toggleTheme} size="$2">
      {themeMode === 'system' ? '🖥️' : themeMode === 'light' ? '☀️' : '🌙'}
    </Button>
  );
};

export default ThemeToggle;