import type { SceneWorld } from '../../../shell/frame/ambientScene/ambientSceneTypes'

export interface ContentItem {
  id: string
  title: string
  description: string
}

export interface AppData {
  brandName: string
  description: string
  iniTheme: string
  portfolioFeatures: ContentItem[]
  appProcedures: ContentItem[]
  themeCustom: { customThemeName: string | null }
  brandNameLoading: { isLoading: boolean }
  about: About | null
  ambientScene: SceneWorld
  /** Runtime provenance added after a successful API response. */
  source: 'network'
}

/** Raw `/data` payload. The API sends more than the app consumes. */
export type InitialStateResponse = Omit<AppData, 'source'> & {
  themes?: string[]
  bddTests?: Array<Record<string, string>>
  themeToggle?: { mode: string; themes: string[]; status: string; error: string | null }
  nav?: { brandName: string }
}

/** Live GitHub data aggregated by api.sdin.dev. */
export interface GithubProfile {
  login: string
  name: string | null
  bio: string | null
  location: string | null
  blog: string | null
  avatarUrl: string
  htmlUrl: string
  publicRepos: number
  followers: number
}

export interface GithubRepo {
  id: string
  name: string
  fullName: string
  owner: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  topics: string[]
  createdAt: string
  htmlUrl: string
  homepage: string | null
  pushedAt: string
}

export interface LanguageCount {
  language: string
  count: number
}

export interface OwnerCount {
  owner: string
  count: number
}

export interface ActivityEvent {
  id: string
  kind: string
  repo: string
  at: string
}

export interface Activity {
  events: ActivityEvent[]
  byRepo: Array<{ repo: string; count: number }>
  byKind: Array<{ kind: string; count: number }>
  total: number
  since: string | null
  until: string | null
}

export interface ContributionDay {
  date: string
  count: number
  level: number
}

export interface Contributions {
  days: ContributionDay[]
  total: number
  source: 'html' | 'graphql'
}

export interface GithubCommit {
  sha: string
  repo: string
  at: string
  url: string
  /** Conventional-commit type, or null for an unstructured subject. */
  type: string | null
  /** Conventional-commit scope, or null when the subject has no scope. */
  scope: string | null
  summary: string
  subject: string
}

export interface CommitTypeCount {
  type: string
  count: number
}

export type GithubAvailabilityState =
  | 'live'
  | 'cached'
  | 'stale'
  | 'partial'
  | 'unavailable'

export type GithubAvailabilityErrorCode =
  | 'PARTIAL_UPSTREAM'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_ERROR'
  | null

export interface GithubResourceAvailability {
  state: GithubAvailabilityState
  cached: boolean
  stale: boolean
  partial: boolean
  fetchedAt: string
  degradedSources: string[]
  errorCode: GithubAvailabilityErrorCode
}

export interface GithubSummaryAvailability {
  state: GithubAvailabilityState
  cached: boolean
  stale: boolean
  partial: boolean
  checkedAt: string
  resources: {
    profile: GithubResourceAvailability
    repos: GithubResourceAvailability
    activity: GithubResourceAvailability
    contributions: GithubResourceAvailability
    commits: GithubResourceAvailability
  }
}

export interface GithubCommits {
  commits: GithubCommit[]
  total: number
  byType: CommitTypeCount[]
  /** Optional during a rolling deploy from the original commit payload. */
  cached?: boolean
  stale?: boolean
  availability?: GithubResourceAvailability
}

export interface ApiStatus {
  status: 'OK'
  /** Optional during a rolling deploy from the legacy `{ status: 'OK' }` shape. */
  service?: string
  version?: string
  checkedAt?: string
  authoredData?: {
    status: 'ready'
    keys: number
  }
}

export interface GithubSummary {
  profile: GithubProfile
  repos: GithubRepo[]
  languages: LanguageCount[]
  owners: OwnerCount[]
  /** Earliest repository creation date across all owners. */
  since: string | null
  activity: Activity
  /** null when the calendar could not be obtained upstream. */
  contributions: Contributions | null
  /** May be absent while an older cached API response is revalidated. */
  commits?: GithubCommits
  cached: boolean
  /** Optional during a rolling deploy from the original summary payload. */
  stale?: boolean
  partial?: boolean
  availability?: GithubSummaryAvailability
  authenticated: boolean
}

/** Authored narrative for the About page, served by the API `/data` contract. */
export interface AboutDomain {
  id: string
  title: string
  summary: string
  detail: string
  repos: string[]
}

export interface AboutPrinciple {
  id: string
  title: string
  description: string
}

export interface About {
  headline: string
  statement: string
  domains: AboutDomain[]
  principles: AboutPrinciple[]
}
