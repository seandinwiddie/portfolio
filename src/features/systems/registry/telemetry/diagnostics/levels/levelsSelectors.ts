import { _, multiMatch, orElse } from 'functional-programming-composition'
import type {
  ApiDataSource,
  ApiStatus,
  GithubSummary,
} from '../../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeTelemetryPresentation } from '../../../../../components/substrate/kernel/api/presentation/presentationTypes'

export type TelemetryLevel = 'nominal' | 'degraded' | 'offline'
export type TelemetryReachability = true | false | 'stale' | null

export interface TelemetryLevelInput {
  readonly source: ApiDataSource
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

export interface TelemetryLevels {
  readonly reachable: TelemetryReachability
  readonly feedLevel: TelemetryLevel
  readonly apiLevel: TelemetryLevel
  readonly githubLevel: TelemetryLevel
}

export interface TelemetryOverallCopy {
  readonly glyph: string
  readonly headline: string
}

const FEED_LEVELS: Readonly<Record<TelemetryLevelInput['source'], TelemetryLevel>> = {
  network: 'nominal',
  stale: 'degraded',
  pending: 'degraded',
  error: 'offline',
}

const API_LEVELS: Readonly<Record<string, TelemetryLevel>> = {
  true: 'nominal',
  false: 'offline',
  stale: 'degraded',
  null: 'degraded',
}

const OVERALL_STATE: Readonly<
  Record<
    string,
    Readonly<{ glyph: string; copy: keyof RuntimeTelemetryPresentation['overall'] }>
  >
> = {
  '1:0': { glyph: '●', copy: 'nominal' },
  '1:1': { glyph: '●', copy: 'nominal' },
  '0:1': { glyph: '◌', copy: 'syncing' },
  '0:0': { glyph: '◐', copy: 'degraded' },
}

const DEFAULT_OVERALL_STATE = OVERALL_STATE['0:0']

const selectReachability = (input: TelemetryLevelInput): TelemetryReachability =>
  orElse(
    multiMatch<TelemetryLevelInput, TelemetryReachability>(input, [
      [
        (candidate) => candidate.api.isError && Boolean(candidate.api.data),
        () => 'stale',
      ],
      [(candidate) => candidate.api.data?.status === 'OK', () => true],
      [(candidate) => candidate.api.isError, () => false],
      [_, () => null],
    ]),
    null
  )

const selectGithubLevel = (
  github: TelemetryLevelInput['github'],
  degraded: boolean
): TelemetryLevel =>
  orElse(
    multiMatch<TelemetryLevelInput['github'], TelemetryLevel>(github, [
      [(candidate) => candidate.isError && Boolean(candidate.data), () => 'degraded'],
      [(candidate) => candidate.isError, () => 'offline'],
      [(candidate) => !candidate.data, () => 'degraded'],
      [(candidate) => candidate.isFetching || degraded, () => 'degraded'],
      [_, () => 'nominal'],
    ]),
    'degraded'
  )

export const selectTelemetryLevels = (input: TelemetryLevelInput): TelemetryLevels => {
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

export const selectOverallCopy =
  (allNominal: boolean, syncing: boolean) =>
  (presentation: RuntimeTelemetryPresentation): TelemetryOverallCopy => {
    const state =
      OVERALL_STATE[`${Number(allNominal)}:${Number(syncing)}`] ?? DEFAULT_OVERALL_STATE
    return { glyph: state.glyph, headline: presentation.overall[state.copy] }
  }

export const selectApiValue =
  (reachable: TelemetryReachability, latency: number | null) =>
  (presentation: RuntimeTelemetryPresentation): string => {
    const values: Readonly<Record<string, string>> = {
      true: `${presentation.values.reachable} · ${latency ?? '—'} ${presentation.latencyUnit}`,
      false: presentation.values.unreachable,
      stale: presentation.values.stale,
      null: presentation.values.probing,
    }
    return values[String(reachable)] ?? presentation.values.probing
  }

export const selectGithubValue = (
  github: TelemetryLevelInput['github'],
  presentation: RuntimeTelemetryPresentation
): string =>
  orElse(
    multiMatch<TelemetryLevelInput['github'], string>(github, [
      [
        (candidate) => candidate.isError && Boolean(candidate.data),
        () => presentation.values.stale,
      ],
      [
        (candidate) => candidate.isFetching && Boolean(candidate.data),
        () => presentation.values.refreshing,
      ],
      [(candidate) => candidate.isFetching, () => presentation.values.fetching],
      [
        (candidate) => Boolean(candidate.data),
        (candidate) =>
          candidate.data?.availability?.state ?? presentation.values.aggregated,
      ],
      [_, () => presentation.values.noData],
    ]),
    presentation.values.noData
  )

export const selectFeedValue = (
  source: TelemetryLevelInput['source'],
  presentation: RuntimeTelemetryPresentation
): string =>
  ({
    network: presentation.values.network,
    stale: presentation.values.stale,
    pending: presentation.values.syncing,
    error: presentation.values.unavailable,
  })[source]

export const selectThemeDiscoveryLevel = (status: string): TelemetryLevel =>
  (({ ready: 'nominal' }) as const)[status] ?? 'degraded'

export const selectLegacyApiStatus =
  (isLoading: boolean, isError: boolean) =>
  (presentation: RuntimeTelemetryPresentation): string =>
    ({
      '1:0': presentation.values.loading,
      '1:1': presentation.values.loading,
      '0:1': presentation.values.error,
      '0:0': presentation.values.connected,
    })[`${Number(isLoading)}:${Number(isError)}`] ?? presentation.values.connected
