import type {
  ApiStatus,
  GithubSummary,
} from '../../../../components/platform/foundation/api/apiTypes'
import { themeProfiles } from '../../../../../styles/themes/themeProfiles'
import { isBuiltInThemeId } from '../../../../../styles/themes/themeTypes'
import type { BodyDataSource } from '../../../../components/portfolio/profile/body/bodyTypes'
import {
  selectApiValue,
  selectFeedValue,
  selectGithubValue,
  selectLegacyApiStatus,
  selectOverallCopy,
  selectStatusLevels,
  selectThemeDiscoveryLevel,
  type StatusLevel,
} from './levels/levelsSelectors'

export interface StatusRowViewModel {
  readonly label: string
  readonly value: string
  readonly glyph: string | null
  readonly color: '$success' | '$warning' | '$danger' | null
}

export interface StatusSignalBarViewModel {
  readonly id: string
  readonly height: number
  readonly color: '$accent' | '$borderColor'
  readonly opacity: number
}

export interface StatusViewProps {
  readonly allNominal: boolean
  readonly overallGlyph: string
  readonly overallHeadline: string
  readonly uplink: Readonly<{
    meter: string
    latency: string
    bars: readonly StatusSignalBarViewModel[]
    rows: readonly StatusRowViewModel[]
  }>
  readonly payload: Readonly<{
    meter: string
    rows: readonly StatusRowViewModel[]
    empty: boolean
  }>
  readonly theme: Readonly<{
    meter: string
    rows: readonly StatusRowViewModel[]
    source: string | null
    sourceLabel: string
  }>
  readonly runtime: Readonly<{
    meter: string
    rowsBeforeSeparator: readonly StatusRowViewModel[]
    rowsAfterSeparator: readonly StatusRowViewModel[]
  }>
}

export interface StatusErrorViewProps {
  readonly error: Error
}

export interface LegacyStatusViewProps {
  readonly apiStatus: string
  readonly themeMode: string
  readonly brandName: string
}

export interface StatusSelectorInput {
  readonly brandName: string
  readonly source: BodyDataSource
  readonly themeStatus: string
  readonly themeLabel: string
  readonly themeSource: string | null
  readonly themes: readonly string[]
  readonly actions: readonly Readonly<{ type: string }>[]
  readonly api: Readonly<{
    data: ApiStatus | undefined
    isError: boolean
    startedTimeStamp: number | undefined
    fulfilledTimeStamp: number | undefined
  }>
  readonly github: Readonly<{
    data: GithubSummary | undefined
    isFetching: boolean
    isError: boolean
  }>
  readonly reducedMotion: boolean
  readonly viewport: Readonly<{ width: number; height: number }>
}

const LEVEL_GLYPH: Readonly<Record<StatusLevel, string>> = {
  nominal: '●',
  degraded: '◐',
  offline: '○',
}

const LEVEL_COLOR: Readonly<Record<StatusLevel, '$success' | '$warning' | '$danger'>> = {
  nominal: '$success',
  degraded: '$warning',
  offline: '$danger',
}

const LATENCY_BANDS = [120, 260, 500, 900] as const
const BAR_STEPS = [1, 2, 3, 4, 5] as const

const row = (label: string, value: string): StatusRowViewModel => ({
  label,
  value,
  glyph: null,
  color: null,
})

const leveledRow =
  (level: StatusLevel) =>
  (label: string, value: string): StatusRowViewModel => ({
    label,
    value,
    glyph: LEVEL_GLYPH[level],
    color: LEVEL_COLOR[level],
  })

const selectLatency = (input: StatusSelectorInput): number | null =>
  input.api.startedTimeStamp && input.api.fulfilledTimeStamp
    ? input.api.fulfilledTimeStamp - input.api.startedTimeStamp
    : null

const selectPayloadRows = (
  data: GithubSummary | undefined
): readonly StatusRowViewModel[] =>
  data
    ? [
        row('repositories', String(data.repos.length)),
        row(
          'operators',
          data.owners.map(({ owner, count }) => `${owner} ${count}`).join(' · ')
        ),
        row('languages', String(data.languages.length)),
        row('contributions / yr', data.contributions?.total.toLocaleString() ?? '—'),
        row('record begins', data.since?.slice(0, 10) ?? '—'),
      ]
    : []

const selectThemeRows = (input: StatusSelectorInput): readonly StatusRowViewModel[] => [
  leveledRow('nominal')('active', input.themeLabel),
  leveledRow(selectThemeDiscoveryLevel(input.themeStatus))(
    'discovery',
    input.themeStatus
  ),
  row(
    'available',
    input.themes
      .map((id) => (isBuiltInThemeId(id) ? themeProfiles[id].label : id))
      .join(' · ') || '—'
  ),
]

export const selectStatusViewModel = (input: StatusSelectorInput): StatusViewProps => {
  const latency = selectLatency(input)
  const levels = selectStatusLevels(input)
  const allNominal =
    levels.feedLevel === 'nominal' &&
    levels.apiLevel === 'nominal' &&
    levels.githubLevel === 'nominal'
  const syncing =
    levels.reachable === null || (!input.github.data && input.github.isFetching)
  const overallCopy = selectOverallCopy(allNominal, syncing)
  const litBars =
    latency === null ? 0 : LATENCY_BANDS.filter((limit) => latency < limit).length + 1
  const apiValue = selectApiValue(levels.reachable, latency)
  const githubValue = selectGithubValue(input.github)
  const actionCount = input.actions.length

  return {
    allNominal,
    overallGlyph: overallCopy.glyph,
    overallHeadline: overallCopy.headline,
    uplink: {
      meter: latency === null ? 'timing…' : `${latency} ms`,
      latency: latency === null ? '—' : String(latency),
      bars: BAR_STEPS.map((step) => ({
        id: String(step),
        height: 4 + step * 3,
        color: step <= litBars ? '$accent' : '$borderColor',
        opacity: step <= litBars ? 1 : 0.5,
      })),
      rows: [
        leveledRow(levels.apiLevel)('api.sdin.dev', apiValue),
        leveledRow(levels.feedLevel)('content feed', selectFeedValue(input.source)),
        leveledRow(levels.githubLevel)('github sync', githubValue),
        row('service', input.api.data?.service ?? 'api.sdin.dev'),
        row(
          'authored data',
          input.api.data?.authoredData
            ? `${input.api.data.authoredData.status} · ${input.api.data.authoredData.keys} keys`
            : 'probing…'
        ),
        row('brand', input.brandName || '—'),
      ],
    },
    payload: {
      meter: input.github.data ? `${input.github.data.repos.length} units` : '—',
      rows: selectPayloadRows(input.github.data),
      empty: !input.github.data,
    },
    theme: {
      meter: `${input.themes.length} loaded`,
      rows: selectThemeRows(input),
      source: input.themeSource,
      sourceLabel: `View canonical source for ${input.themeLabel}`,
    },
    runtime: {
      meter: `${actionCount} actions`,
      rowsBeforeSeparator: [
        leveledRow('nominal')('store', '7 slices · rtk query'),
        row('actions observed', String(actionCount)),
        row('last action', input.actions[0]?.type ?? 'none yet'),
      ],
      rowsAfterSeparator: [
        row('reduced motion', input.reducedMotion ? 'respected' : 'not requested'),
        row(
          'viewport',
          `${Math.round(input.viewport.width)}×${Math.round(input.viewport.height)}`
        ),
      ],
    },
  }
}

export const selectLegacyStatusViewModel = (
  input: Readonly<{
    isLoading: boolean
    isError: boolean
    themeMode: string
    brandName: string
  }>
): LegacyStatusViewProps => ({
  apiStatus: selectLegacyApiStatus(input.isLoading, input.isError),
  themeMode: input.themeMode,
  brandName: input.brandName,
})
