import React, { useCallback } from 'react';
import { Button } from 'tamagui';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setThemeMode } from '../features/themeToggle/themeToggleSlice';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedButton = Animated.createAnimatedComponent(Button);

const ThemeToggle: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const themeMode = useAppSelector((state) => state.themeToggle.mode);
  const themes = useAppSelector((state) => state.themeToggle.themes);
  const dispatch = useAppDispatch();
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const toggleTheme = useCallback(() => {
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    dispatch(setThemeMode(themes[nextIndex]));
    rotation.value = withSpring(rotation.value + 360);
  }, [dispatch, rotation, themeMode, themes]);

  if (isLoading) return null;
  if (error) return <Button>Error loading theme data</Button>;

  const themeIcon = getComputedStyle(document.documentElement).getPropertyValue(`--theme-icon-${themeMode}`).trim();

  return (
    <AnimatedButton onPress={toggleTheme} size="$2" style={animatedStyle}>
      <span>{themeIcon}</span>
    </AnimatedButton>
  );
};

export default ThemeToggle;
