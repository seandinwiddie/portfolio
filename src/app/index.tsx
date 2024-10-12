import React from 'react';
import { View, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';
import Nav from '../components/Nav';
import Body from '../components/Body';
import ThemeToggle from '../components/ThemeToggle';

const MainScreen = () => {
  return (
    <YStack f={1}>
      <Nav />
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
      <Body />
    </YStack>
  );
};

const styles = StyleSheet.create({
  themeToggleContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default MainScreen;
