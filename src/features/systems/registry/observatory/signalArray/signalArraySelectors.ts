import { fromNullable, match } from 'functional-programming-composition'
import type {
  ObservatoryPresentation,
  PublicObservatory,
  PublicPresence,
} from '../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'
import type { ThemeVisualization } from '../../../../../styles/themes/themeTypes'
import { selectEstateProjections } from './metrics/metricsAdapters'
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

export interface ObservatoryCapabilityViewModel {
  readonly label: string
  readonly availability: string
  readonly availabilityLabel: string
  readonly tone: ObservatoryTone
  readonly metrics: readonly ObservatoryMetricViewModel[]
  readonly chart: ObservatoryChartViewModel
}

export interface ObservatoryEstatePresenceViewModel {
  readonly label: string
  readonly availability: string
  readonly state: string
  readonly checkedAt: string | null
  readonly observed: string
  readonly latency: string
  readonly httpStatus: string
  readonly tone: ObservatoryTone
}

export interface ObservatoryEstateRepositoryViewModel {
  readonly id: string
  readonly label: string
  readonly url: string
  readonly status: 'public-source'
  readonly statusLabel: string
}

export interface ObservatoryEstateViewModel {
  readonly id: string
  readonly label: string
  readonly url: string
  readonly window: string
  readonly instrumented: boolean
  readonly availabilityLabel: string
  readonly tone: ObservatoryTone
  readonly presence: ObservatoryEstatePresenceViewModel
  readonly repositoriesLabel: string
  readonly repositories: readonly ObservatoryEstateRepositoryViewModel[]
  readonly live: ObservatoryMetricViewModel | null
  readonly analytics: ObservatoryCapabilityViewModel
  readonly discovery: ObservatoryCapabilityViewModel
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
  readonly estates: readonly ObservatoryEstateViewModel[]
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
  const window = selectWindow(presentation.windowLabel, input.observatory)
  return {
    dataStatus: input.dataStatus,
    visible: true,
    eyebrow: presentation.eyebrow,
    headline: presentation.headline,
    statement: presentation.statement,
    impactLabel: presentation.impactLabel,
    presenceLabel: presentation.presenceLabel,
    window,
    observed: `${presentation.checkedLabel} ${selectObservedAt(input.observatory?.checkedAt)}`,
    feedLabel: feed.label,
    feedTone: feed.tone,
    impact: selectImpactProjection(presentation, input.github),
    impactState: selectImpactState(presentation, input),
    estates: selectEstateProjections(presentation, input.visualization)(window)(
      input.observatory?.estates ?? []
    ),
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
  estates: [],
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
