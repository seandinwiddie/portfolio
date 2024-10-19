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

export interface ThemeToggleState {
  mode: string;
  themes: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
