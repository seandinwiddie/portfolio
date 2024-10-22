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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('tamagui', () => ({
  ...jest.requireActual('tamagui'),
  TamaguiProvider: ({ children }) => children,
  Theme: ({ children }) => children,
  ScrollView: ({ children }) => children,
  YStack: ({ children }) => children,
  Text: ({ children }) => children,
  Card: ({ children }) => children,
  Separator: () => null,
}));

jest.mock('./tamagui.config.ts', () => ({
  config: {
    settings: {
      disableSSR: true,
    },
  },
}));
