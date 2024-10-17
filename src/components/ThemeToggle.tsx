import React from 'react';
import { Button } from 'tamagui';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setThemeMode } from '../features/themeToggle/themeToggleSlice';
import { useGetAppDataQuery } from '../features/api/apiSlice';

const ThemeToggle: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const themeMode = useAppSelector((state) => state.themeToggle.mode);
  const themes = useAppSelector((state) => state.themeToggle.themes);
  const dispatch = useAppDispatch();

  if (isLoading) return null;
  if (error) return <Button>Error loading theme data</Button>;

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    dispatch(setThemeMode(themes[nextIndex]));
  };

  const themeIcon = getComputedStyle(document.documentElement).getPropertyValue(`--theme-icon-${themeMode}`).trim();

  return (
    <Button onPress={toggleTheme} size="$2">
      <span>{themeIcon}</span>
    </Button>
  );
};

export default ThemeToggle;
