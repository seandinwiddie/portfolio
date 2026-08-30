import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { cycleTheme, selectThemeMode } from '../features/themeToggle/themeToggleSlice';
import { Button } from 'tamagui';

const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectThemeMode);

  const handleToggle = () => {
    dispatch(cycleTheme());
  };

  return (
    <Button testID="theme-toggle" onPress={handleToggle} variant="outlined">
      Theme: {currentTheme}
    </Button>
  );
};

export default ThemeToggle;
