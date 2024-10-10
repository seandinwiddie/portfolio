import React from 'react';
import { View, StyleSheet } from 'react-native';
import Nav from '../components/Nav';
import Body from '../components/Body';
import ThemeToggle from '../components/ThemeToggle';

const MainScreen = () => {
  return (
    <View style={styles.container}>
      <Nav />
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
      <Body />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default MainScreen;
