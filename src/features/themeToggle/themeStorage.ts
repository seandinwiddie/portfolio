import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'portfolio.themeMode';

/**
 * The chosen theme used to reset to "light" on every document load -- nothing
 * was written to storage at all. AsyncStorage is backed by localStorage on web
 * and by native storage on iOS/Android, so one implementation covers both.
 */
export const loadStoredTheme = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(THEME_KEY);
  } catch {
    // Private browsing and disabled site data both throw here; a missing
    // preference is not worth breaking startup over.
    return null;
  }
};

export const saveStoredTheme = async (mode: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch {
    /* non-fatal: the theme simply will not persist */
  }
};
