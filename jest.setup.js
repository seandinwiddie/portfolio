try {
  require('react-native-gesture-handler/jestSetup');
} catch (error) {
  console.warn('react-native-gesture-handler/jestSetup not found. Skipping.');
}

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// The previous mock only supplied useRouter, so any component using Link or
// usePathname (Nav, BrandName, the root layout) blew up on render.
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    usePathname: () => '/',
    Link: ({ children }) => React.createElement(React.Fragment, null, children),
    Slot: () => null,
    SplashScreen: {
      preventAutoHideAsync: jest.fn(),
      hideAsync: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// NOTE: tamagui itself is deliberately NOT mocked. The old mock replaced Text/Card/
// YStack with functions returning raw children, which meant tests asserted against
// a component tree the app never actually renders. Tests wrap in a real
// TamaguiProvider instead (see src/features/utils/renderWithProviders.tsx).
