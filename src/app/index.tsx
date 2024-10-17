import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';
import Nav from '../components/Nav';
import Body from '../components/Body';
import ThemeToggle from '../components/ThemeToggle';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

const MainScreen = () => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000, easing: Easing.ease });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedYStack f={1} style={animatedStyle}>
      <Nav />
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
      <Body />
    </AnimatedYStack>
  );
};

const styles = StyleSheet.create({
  themeToggleContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  navText: {
    color: '#ffffff',
    textShadow: '0 0 5px #36f9f6, 0 0 10px #36f9f6',
  },
});

export default MainScreen;
