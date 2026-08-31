import { _, multiMatch, orElse } from 'functional-programming-composition'
import type {
  ApiStatus,
  GithubSummary,
} from '../../../../../components/platform/foundation/api/apiTypes'
import type { BodyDataSource } from '../../../../../components/portfolio/profile/body/bodyTypes'

export type StatusLevel = 'nominal' | 'degraded' | 'offline'
export type StatusReachability = true | false | null

export interface StatusLevelInput {
  readonly source: BodyDataSource
  readonly api: Readonly<{
    data: ApiStatus | undefined
    isError: boolean
  }>
  readonly github: Readonly<{
    data: GithubSummary | undefined
    isFetching: boolean
    isError: boolean
  }>
}

export interface StatusLevels {
  readonly reachable: StatusReachability
  readonly feedLevel: StatusLevel
  readonly apiLevel: StatusLevel
  readonly githubLevel: StatusLevel
}

export interface StatusOverallCopy {
  readonly glyph: string
  readonly headline: string
}

const FEED_LEVELS: Readonly<Record<StatusLevelInput['source'], StatusLevel>> = {
  network: 'nominal',
  pending: 'offline',
  error: 'offline',
}

const FEED_VALUES: Readonly<Record<StatusLevelInput['source'], string>> = {
  network: 'live from API',
  pending: 'syncing',
  error: 'API data unavailable',
}

const API_LEVELS: Readonly<Record<string, StatusLevel>> = {
  true: 'nominal',
  false: 'offline',
  null: 'degraded',
}

const OVERALL_COPY: Readonly<Record<string, StatusOverallCopy>> = {
  '1:0': { glyph: '●', headline: 'All systems nominal.' },
  '1:1': { glyph: '●', headline: 'All systems nominal.' },
  '0:1': { glyph: '◌', headline: 'Systems synchronizing.' },
  '0:0': { glyph: '◐', headline: 'Running degraded.' },
}

const DEFAULT_OVERALL_COPY: StatusOverallCopy = OVERALL_COPY['0:0']

const API_VALUES: Readonly<Record<string, (latency: number | null) => string>> = {
  true: (latency) => `reachable · ${latency} ms`,
  false: () => 'unreachable',
  null: () => 'probing…',
}

const LEGACY_API_VALUES: Readonly<Record<string, string>> = {
  '1:0': 'Loading',
  '1:1': 'Loading',
  '0:1': 'Error',
  '0:0': 'Connected',
}

const selectReachability = (input: StatusLevelInput): StatusReachability =>
  orElse(
    multiMatch<StatusLevelInput, StatusReachability>(input, [
      [(candidate) => candidate.api.data?.status === 'OK', () => true],
      [(candidate) => candidate.api.isError, () => false],
      [_, () => null],
    ]),
    null
  )

const selectGithubLevel = (
  github: StatusLevelInput['github'],
  degraded: boolean
): StatusLevel =>
  orElse(
    multiMatch<StatusLevelInput['github'], StatusLevel>(github, [
      [(candidate) => candidate.isError, () => 'offline'],
      [(candidate) => !candidate.data, () => 'degraded'],
      [(candidate) => candidate.isFetching || degraded, () => 'degraded'],
      [_, () => 'nominal'],
    ]),
    'degraded'
  )

export const selectStatusLevels = (input: StatusLevelInput): StatusLevels => {
  const reachable = selectReachability(input)
  const githubDegraded = Boolean(
    input.github.data?.partial ||
      input.github.data?.stale ||
      input.github.data?.availability?.state === 'partial'
  )

  return {
    reachable,
    feedLevel: FEED_LEVELS[input.source],
    apiLevel: API_LEVELS[String(reachable)] ?? 'degraded',
    githubLevel: selectGithubLevel(input.github, githubDegraded),
  }
}

export const selectOverallCopy = (
  allNominal: boolean,
  syncing: boolean
): StatusOverallCopy =>
  OVERALL_COPY[`${Number(allNominal)}:${Number(syncing)}`] ?? DEFAULT_OVERALL_COPY

export const selectApiValue = (
  reachable: StatusReachability,
  latency: number | null
): string => API_VALUES[String(reachable)]?.(latency) ?? 'probing…'

export const selectGithubValue = (github: StatusLevelInput['github']): string =>
  orElse(
    multiMatch<StatusLevelInput['github'], string>(github, [
      [
        (candidate) => candidate.isFetching && Boolean(candidate.data),
        () => 'refreshing…',
      ],
      [(candidate) => candidate.isFetching, () => 'fetching…'],
      [
        (candidate) => Boolean(candidate.data),
        (candidate) => candidate.data?.availability?.state ?? 'aggregated',
      ],
      [_, () => 'no data'],
    ]),
    'no data'
  )

export const selectFeedValue = (source: StatusLevelInput['source']): string =>
  FEED_VALUES[source]

export const selectThemeDiscoveryLevel = (status: string): StatusLevel =>
  (({ ready: 'nominal' }) as const)[status] ?? 'degraded'

export const selectLegacyApiStatus = (isLoading: boolean, isError: boolean): string =>
  LEGACY_API_VALUES[`${Number(isLoading)}:${Number(isError)}`] ?? 'Connected'
