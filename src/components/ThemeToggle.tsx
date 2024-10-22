import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store';
import { cycleTheme } from '../features/themeToggle/themeToggleSlice';
import { Button } from 'tamagui';

const ThemeToggle: React.FC = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: RootState) => state.themeToggle.mode);

  const handleToggle = () => {
    dispatch(cycleTheme());
  };

  return (
    <Button onPress={handleToggle} variant="outlined">
      Theme: {currentTheme}
    </Button>
  );
};

export default ThemeToggle;
