import { fromNullable, match } from 'functional-programming-composition'
import type {
  ObservatoryPresentation,
  PublicObservatory,
  PublicPresence,
} from '../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'
import type { ThemeVisualization } from '../../../../../styles/themes/themeTypes'
import { selectPropertyProjections } from './metrics/metricsAdapters'
import {
  selectFeedProjection,
  selectImpactProjection,
  selectImpactState,
  selectObservedAt,
  selectPresenceProjection,
  selectPresenceState,
  selectWindow,
} from './provenance/provenanceAdapters'

export type ObservatoryTone = 'positive' | 'neutral' | 'negative' | 'degraded'

export interface ObservatoryMetricViewModel {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly baseline: string | null
  readonly delta: string | null
  readonly tone: ObservatoryTone
}

export interface ObservatoryChartPointViewModel {
  readonly id: string
  readonly x: number
  readonly y: number
}

export interface ObservatoryChartViewModel {
  readonly id: string
  readonly label: string
  readonly accessibilityLabel: string
  readonly path: string
  readonly areaPath: string
  readonly points: readonly ObservatoryChartPointViewModel[]
  readonly stroke: string
  readonly fill: string
  readonly axisInk: string
  readonly empty: boolean
}

export interface ObservatoryPropertyViewModel {
  readonly id: string
  readonly label: string
  readonly availabilityLabel: string
  readonly tone: ObservatoryTone
  readonly live: ObservatoryMetricViewModel | null
  readonly analyticsLabel: string
  readonly analytics: readonly ObservatoryMetricViewModel[]
  readonly analyticsChart: ObservatoryChartViewModel
  readonly discoveryLabel: string
  readonly discovery: readonly ObservatoryMetricViewModel[]
  readonly discoveryChart: ObservatoryChartViewModel
  readonly baselineRecorded: boolean
  readonly baselineLabel: string
}

export interface PresenceChannelViewModel {
  readonly id: string
  readonly label: string
  readonly state: string
  readonly latency: string
  readonly tone: ObservatoryTone
}

export interface ObservatoryViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly visible: boolean
  readonly eyebrow: string
  readonly headline: string
  readonly statement: string
  readonly impactLabel: string
  readonly presenceLabel: string
  readonly window: string
  readonly observed: string
  readonly feedLabel: string
  readonly feedTone: ObservatoryTone
  readonly impact: readonly ObservatoryMetricViewModel[]
  readonly impactState: string | null
  readonly properties: readonly ObservatoryPropertyViewModel[]
  readonly presence: readonly PresenceChannelViewModel[]
  readonly presenceState: string | null
}

export interface ObservatorySelectorInput {
  readonly presentation: ObservatoryPresentation | undefined
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly observatory: PublicObservatory | undefined
  readonly observatoryPending: boolean
  readonly observatoryError: boolean
  readonly presence: PublicPresence | undefined
  readonly presencePending: boolean
  readonly presenceError: boolean
  readonly github: GithubSummary | undefined
  readonly githubPending: boolean
  readonly githubError: boolean
  readonly visualization: ThemeVisualization
}

const visibleObservatory = (
  presentation: ObservatoryPresentation,
  input: ObservatorySelectorInput
): ObservatoryViewProps => {
  const feed = selectFeedProjection(presentation, input)
  return {
    dataStatus: input.dataStatus,
    visible: true,
    eyebrow: presentation.eyebrow,
    headline: presentation.headline,
    statement: presentation.statement,
    impactLabel: presentation.impactLabel,
    presenceLabel: presentation.presenceLabel,
    window: selectWindow(presentation.windowLabel, input.observatory),
    observed: `${presentation.checkedLabel} ${selectObservedAt(input.observatory?.checkedAt)}`,
    feedLabel: feed.label,
    feedTone: feed.tone,
    impact: selectImpactProjection(presentation, input.github),
    impactState: selectImpactState(presentation, input),
    properties: selectPropertyProjections(
      presentation,
      input.visualization
    )(input.observatory?.properties ?? []),
    presence: selectPresenceProjection(input.presence),
    presenceState: selectPresenceState(presentation, input),
  }
}

const hiddenObservatory = (input: ObservatorySelectorInput): ObservatoryViewProps => ({
  dataStatus: input.dataStatus,
  visible: false,
  eyebrow: '',
  headline: '',
  statement: '',
  impactLabel: '',
  presenceLabel: '',
  window: '',
  observed: '',
  feedLabel: '',
  feedTone: 'degraded',
  impact: [],
  impactState: null,
  properties: [],
  presence: [],
  presenceState: null,
})

export const selectObservatoryViewModel = (
  input: ObservatorySelectorInput
): ObservatoryViewProps =>
  match(
    fromNullable(input.presentation),
    (presentation) => visibleObservatory(presentation, input),
    () => hiddenObservatory(input)
  )
