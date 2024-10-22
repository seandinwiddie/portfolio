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

export interface AppData {
  brandName: string;
  description: string;
  iniTheme: string;
  portfolioFeatures: Array<{ id: string; title: string; description: string }>;
  appProcedures: Array<{ id: string; title: string; description: string }>;
}
