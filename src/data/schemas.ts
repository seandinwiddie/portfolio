export const initialStateSchema = {
  type: 'object',
  required: ['brandName', 'description', 'iniTheme', 'themes', 'portfolioFeatures', 'appProcedures'],
  properties: {
    brandName: { type: 'string' },
    description: { type: 'string' },
    iniTheme: { type: 'string' },
    themes: {
      type: 'array',
      items: { type: 'string' }
    },
    portfolioFeatures: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'description'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' }
        }
      }
    },
    appProcedures: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'description'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  }
};

export interface ContentItem {
  id: string;
  title: string;
  description: string;
}

export interface AppData {
  brandName: string;
  description: string;
  iniTheme: string;
  portfolioFeatures: ContentItem[];
  appProcedures: ContentItem[];
  themeCustom: { customThemeName: string | null };
  brandNameLoading: { isLoading: boolean };
}

/** Raw `/data` payload. The API sends more than the app consumes. */
export interface InitialStateResponse extends AppData {
  themes?: string[];
  bddTests?: Array<Record<string, string>>;
  themeToggle?: { mode: string; themes: string[]; status: string; error: string | null };
  nav?: { brandName: string };
}
