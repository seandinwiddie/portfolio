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
  /** Whether this payload came from the API or the bundled fallback. */
  source: 'network' | 'fallback';
}

/** Raw `/data` payload. The API sends more than the app consumes. */
export interface InitialStateResponse extends Omit<AppData, 'source'> {
  themes?: string[];
  bddTests?: Array<Record<string, string>>;
  themeToggle?: { mode: string; themes: string[]; status: string; error: string | null };
  nav?: { brandName: string };
}

/** Live GitHub data aggregated by api.sdin.dev. */
export interface GithubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  avatarUrl: string;
  htmlUrl: string;
  publicRepos: number;
  followers: number;
}

export interface GithubRepo {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  htmlUrl: string;
  homepage: string | null;
  pushedAt: string;
}

export interface LanguageCount {
  language: string;
  count: number;
}

export interface GithubSummary {
  profile: GithubProfile;
  repos: GithubRepo[];
  languages: LanguageCount[];
  cached: boolean;
  authenticated: boolean;
}
