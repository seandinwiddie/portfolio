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
  about: About | null;
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
  fullName: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  createdAt: string;
  htmlUrl: string;
  homepage: string | null;
  pushedAt: string;
}

export interface LanguageCount {
  language: string;
  count: number;
}

export interface OwnerCount {
  owner: string;
  count: number;
}

export interface ActivityEvent {
  id: string;
  kind: string;
  repo: string;
  at: string;
}

export interface Activity {
  events: ActivityEvent[];
  byRepo: Array<{ repo: string; count: number }>;
  byKind: Array<{ kind: string; count: number }>;
  total: number;
  since: string | null;
  until: string | null;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

export interface Contributions {
  days: ContributionDay[];
  total: number;
  source: 'html' | 'graphql';
}

export interface GithubSummary {
  profile: GithubProfile;
  repos: GithubRepo[];
  languages: LanguageCount[];
  owners: OwnerCount[];
  /** Earliest repository creation date across all owners. */
  since: string | null;
  activity: Activity;
  /** null when the calendar could not be obtained upstream. */
  contributions: Contributions | null;
  cached: boolean;
  authenticated: boolean;
}

/** Authored narrative for the About page, served from initialState.json. */
export interface AboutDomain {
  id: string;
  title: string;
  summary: string;
  detail: string;
  repos: string[];
}

export interface AboutPrinciple {
  id: string;
  title: string;
  description: string;
}

export interface About {
  headline: string;
  statement: string;
  domains: AboutDomain[];
  principles: AboutPrinciple[];
}
