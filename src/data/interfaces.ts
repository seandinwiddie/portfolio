import { AppData } from './schemas';

export interface ThemeToggleState {
  mode: string;
  themes: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export interface NavState {
  brandName: string;
}

export interface BrandNameState {
  value: string;
  isLoading: boolean;
}

export interface ThemeCustomState {
  customThemeName: string | null;
}

// Re-export AppData interface from schemas.ts
export { AppData };
