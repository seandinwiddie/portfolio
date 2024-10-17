import React, { useEffect } from 'react';
import { Text, Spinner, YStack } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';
import '../styles/nav.css';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const Nav: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const brandName = useAppSelector((state) => state.nav.brandName);
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
    <Animated.View style={animatedStyle}>
      <YStack className="nav-container">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <Text>Error loading brand name</Text>
        ) : (
          <Text fontSize={24} fontWeight="bold" className="nav-text" textAlign="center">
            🚀 {brandName}
          </Text>
        )}
      </YStack>
    </Animated.View>
  );
};

export default Nav;
