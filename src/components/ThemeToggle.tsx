import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store';
import { setThemeMode } from '../features/themeToggle/themeToggleSlice';
import { Button } from 'tamagui';

const ThemeToggle: React.FC = () => {
  const dispatch = useDispatch();
  const themes = useSelector((state: RootState) => state.themeToggle.themes);
  const currentTheme = useSelector((state: RootState) => state.themeToggle.mode);

  const handleToggle = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    dispatch(setThemeMode(themes[nextIndex]));
  };

  return (
    <Button onPress={handleToggle} variant="outlined">
      Theme: {currentTheme}
    </Button>
  );
};

export default ThemeToggle;
