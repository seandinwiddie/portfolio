import type {
  ApiDataSource,
  GithubSummary,
} from '../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeTelemetryPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { TelemetrySelectorInput } from '../../../../components/registry/telemetry/diagnostics/diagnosticsTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'
import { themeProfiles } from '../../../../../styles/themes/themeProfiles'
import { isBuiltInThemeId } from '../../../../../styles/themes/themeTypes'
import {
  selectApiValue,
  selectFeedValue,
  selectGithubValue,
  selectLegacyApiStatus,
  selectOverallCopy,
  selectTelemetryLevels,
  selectThemeDiscoveryLevel,
  type TelemetryLevel,
} from './levels/levelsSelectors'

export interface TelemetryRowViewModel {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly glyph: string | null
  readonly color: '$success' | '$warning' | '$danger' | null
}

export interface TelemetrySignalBarViewModel {
  readonly id: string
  readonly height: number
  readonly color: '$accent' | '$borderColor'
  readonly opacity: number
}

export interface TelemetryViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly eyebrow: string
  readonly statement: string
  readonly panels: RuntimeTelemetryPresentation['panels']
  readonly latencyUnit: string
  readonly emptyLabel: string
  readonly allNominal: boolean
  readonly overallGlyph: string
  readonly overallHeadline: string
  readonly uplink: Readonly<{
    meter: string
    latency: string
    bars: readonly TelemetrySignalBarViewModel[]
    rows: readonly TelemetryRowViewModel[]
  }>
  readonly payload: Readonly<{
    meter: string
    rows: readonly TelemetryRowViewModel[]
    empty: boolean
  }>
  readonly theme: Readonly<{
    meter: string
    rows: readonly TelemetryRowViewModel[]
    source: string | null
    sourceLabel: string
  }>
  readonly runtime: Readonly<{
    meter: string
    rowsBeforeSeparator: readonly TelemetryRowViewModel[]
    rowsAfterSeparator: readonly TelemetryRowViewModel[]
  }>
}

export type TelemetryDataViewProps = Omit<TelemetryViewProps, 'dataStatus'> & {
  readonly staleLabel: string | null
}

export interface TelemetryDeckViewProps {
  readonly apiStatus: string
  readonly themeMode: string
  readonly brandName: string
  readonly heading: string
  readonly apiLabel: string
  readonly themeLabel: string
  readonly brandLabel: string
}

const LEVEL_GLYPH: Readonly<Record<TelemetryLevel, string>> = {
  nominal: '●',
  degraded: '◐',
  offline: '○',
}

const LEVEL_COLOR: Readonly<Record<TelemetryLevel, '$success' | '$warning' | '$danger'>> =
  {
    nominal: '$success',
    degraded: '$warning',
    offline: '$danger',
  }

const LATENCY_BANDS = [120, 260, 500, 900] as const
const BAR_STEPS = [1, 2, 3, 4, 5] as const

const API_DATA_SOURCES: Readonly<Record<string, ApiDataSource>> = {
  '1:0': 'network',
  '1:1': 'stale',
  '0:1': 'error',
  '0:0': 'pending',
}

export const selectApiDataSource = (
  available: boolean,
  isError: boolean
): ApiDataSource =>
  API_DATA_SOURCES[`${Number(available)}:${Number(isError)}`] ?? 'pending'

const row = (label: string, value: string): TelemetryRowViewModel => ({
  id: label,
  label,
  value,
  glyph: null,
  color: null,
})

const leveledRow =
  (level: TelemetryLevel) =>
  (label: string, value: string): TelemetryRowViewModel => ({
    id: label,
    label,
    value,
    glyph: LEVEL_GLYPH[level],
    color: LEVEL_COLOR[level],
  })

const selectLatency = (input: TelemetrySelectorInput): number | null =>
  input.api.startedTimeStamp && input.api.fulfilledTimeStamp
    ? input.api.fulfilledTimeStamp - input.api.startedTimeStamp
    : null

const selectPayloadRows = (
  data: GithubSummary | undefined,
  presentation: RuntimeTelemetryPresentation
): readonly TelemetryRowViewModel[] =>
  data
    ? [
        row(presentation.labels.repositories ?? '', String(data.repos.length)),
        row(
          presentation.labels.operators ?? '',
          data.owners.map(({ owner, count }) => `${owner} ${count}`).join(' · ')
        ),
        row(presentation.labels.languages ?? '', String(data.languages.length)),
        row(
          presentation.labels.contributions ?? '',
          data.contributions?.total.toLocaleString() ?? '—'
        ),
        row(presentation.labels.recordBegins ?? '', data.since?.slice(0, 10) ?? '—'),
      ]
    : []

const selectThemeRows = (
  input: TelemetrySelectorInput
): readonly TelemetryRowViewModel[] => [
  leveledRow('nominal')(input.presentation.labels.active ?? '', input.themeLabel),
  leveledRow(selectThemeDiscoveryLevel(input.themeStatus))(
    input.presentation.labels.discovery ?? '',
    input.themeStatus
  ),
  row(
    input.presentation.labels.available ?? '',
    input.themes
      .map((id) => (isBuiltInThemeId(id) ? themeProfiles[id].label : id))
      .join(' · ') || '—'
  ),
]

export const selectTelemetryViewModel = (
  input: TelemetrySelectorInput
): Omit<TelemetryViewProps, 'dataStatus'> => {
  const latency = selectLatency(input)
  const levels = selectTelemetryLevels(input)
  const allNominal =
    levels.feedLevel === 'nominal' &&
    levels.apiLevel === 'nominal' &&
    levels.githubLevel === 'nominal'
  const syncing =
    levels.reachable === null || (!input.github.data && input.github.isFetching)
  const overallCopy = selectOverallCopy(allNominal, syncing)(input.presentation)
  const litBars =
    latency === null ? 0 : LATENCY_BANDS.filter((limit) => latency < limit).length + 1
  const apiValue = selectApiValue(levels.reachable, latency)(input.presentation)
  const githubValue = selectGithubValue(input.github, input.presentation)
  const actionCount = input.actions.length

  return {
    eyebrow: input.presentation.eyebrow,
    statement: input.presentation.statement,
    panels: input.presentation.panels,
    latencyUnit: input.presentation.latencyUnit,
    emptyLabel: input.presentation.emptyLabel,
    allNominal,
    overallGlyph: overallCopy.glyph,
    overallHeadline: overallCopy.headline,
    uplink: {
      meter:
        latency === null
          ? input.presentation.values.timing
          : `${latency} ${input.presentation.latencyUnit}`,
      latency: latency === null ? '—' : String(latency),
      bars: BAR_STEPS.map((step) => ({
        id: String(step),
        height: 4 + step * 3,
        color: step <= litBars ? '$accent' : '$borderColor',
        opacity: step <= litBars ? 1 : 0.5,
      })),
      rows: [
        leveledRow(levels.apiLevel)(input.presentation.labels.api ?? '', apiValue),
        leveledRow(levels.feedLevel)(
          input.presentation.labels.contentFeed ?? '',
          selectFeedValue(input.source, input.presentation)
        ),
        leveledRow(levels.githubLevel)(
          input.presentation.labels.githubSync ?? '',
          githubValue
        ),
        row(
          input.presentation.labels.service ?? '',
          input.api.data?.service ?? input.presentation.labels.api ?? ''
        ),
        row(
          input.presentation.labels.authoredData ?? '',
          input.api.data?.authoredData
            ? `${input.api.data.authoredData.status} · ${input.api.data.authoredData.keys} ${input.presentation.values.keys ?? ''}`
            : input.presentation.values.probing
        ),
        row(input.presentation.labels.brand ?? '', input.brandName || '—'),
      ],
    },
    payload: {
      meter: input.github.data
        ? `${input.github.data.repos.length} ${input.presentation.values.units}`
        : '—',
      rows: selectPayloadRows(input.github.data, input.presentation),
      empty: !input.github.data,
    },
    theme: {
      meter: `${input.themes.length} ${input.presentation.values.loaded}`,
      rows: selectThemeRows(input),
      source: input.themeSource,
      sourceLabel: `${input.presentation.sourceLabel} ${input.themeLabel}`,
    },
    runtime: {
      meter: `${actionCount} ${input.presentation.values.actions}`,
      rowsBeforeSeparator: [
        leveledRow('nominal')(
          input.presentation.labels.store ?? '',
          input.presentation.values.store
        ),
        row(input.presentation.labels.actionsObserved ?? '', String(actionCount)),
        row(
          input.presentation.labels.lastAction ?? '',
          input.actions[0]?.type ?? input.presentation.values.noneYet
        ),
      ],
      rowsAfterSeparator: [
        row(
          input.presentation.labels.reducedMotion ?? '',
          input.reducedMotion
            ? input.presentation.values.respected
            : input.presentation.values.notRequested
        ),
        row(
          input.presentation.labels.viewport ?? '',
          `${Math.round(input.viewport.width)}×${Math.round(input.viewport.height)}`
        ),
      ],
    },
  }
}

export const selectTelemetryDeckViewModel = (
  input: Readonly<{
    isLoading: boolean
    isError: boolean
    themeMode: string
    brandName: string
    presentation: RuntimeTelemetryPresentation
  }>
): TelemetryDeckViewProps => ({
  apiStatus: selectLegacyApiStatus(input.isLoading, input.isError)(input.presentation),
  themeMode: input.themeMode,
  brandName: input.brandName,
  heading: input.presentation.deck.heading,
  apiLabel: input.presentation.deck.api,
  themeLabel: input.presentation.deck.theme,
  brandLabel: input.presentation.deck.brand,
})
