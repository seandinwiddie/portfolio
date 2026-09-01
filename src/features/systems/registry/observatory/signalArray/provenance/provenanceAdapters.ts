import {
  _,
  fromNullable,
  match,
  multiMatch,
  orElse,
} from 'functional-programming-composition'
import type {
  ObservatoryAvailability,
  ObservatoryPresentation,
  PresenceState,
  PublicObservatory,
  PublicPresence,
} from '../../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { GithubSummary } from '../../../../../components/substrate/kernel/api/apiTypes'
import type {
  ObservatoryMetricViewModel,
  ObservatorySelectorInput,
  ObservatoryTone,
  PresenceChannelViewModel,
} from '../signalArraySelectors'

export type ObservatoryFeedProjection = Readonly<{
  label: string
  tone: ObservatoryTone
}>

const MAX_PRESENCE_CHANNELS = 7
const integer = (value: number): string => Math.round(value).toLocaleString()
const availabilityTone: Readonly<Record<ObservatoryAvailability, ObservatoryTone>> = {
  available: 'positive',
  partial: 'degraded',
  unavailable: 'negative',
  unconfigured: 'degraded',
}

const availabilityLabelOf = (
  availability: ObservatoryAvailability,
  presentation: ObservatoryPresentation
): string =>
  ({
    available: presentation.windowLabel,
    partial: presentation.partialLabel,
    unavailable: presentation.unavailableLabel,
    unconfigured: presentation.unconfiguredLabel,
  })[availability]

export const selectImpactProjection = (
  presentation: ObservatoryPresentation,
  github: GithubSummary | undefined
): readonly ObservatoryMetricViewModel[] =>
  match(
    fromNullable(github),
    (summary) => [
      {
        id: 'followers',
        label: presentation.metrics.followers,
        value: integer(summary.profile.followers),
        baseline: null,
        delta: null,
        tone: 'neutral',
      },
      {
        id: 'repositories',
        label: presentation.metrics.repositories,
        value: integer(summary.repos.length),
        baseline: null,
        delta: null,
        tone: 'neutral',
      },
      ...(summary.contributions
        ? [
            {
              id: 'contributions',
              label: presentation.metrics.contributions,
              value: integer(summary.contributions.total),
              baseline: null,
              delta: null,
              tone: 'neutral' as const,
            },
          ]
        : []),
    ],
    () => []
  )

const presenceTone: Readonly<Record<PresenceState, ObservatoryTone>> = {
  operational: 'positive',
  limited: 'degraded',
  unreachable: 'negative',
}

export const selectPresenceProjection = (
  presence: PublicPresence | undefined
): readonly PresenceChannelViewModel[] =>
  presence?.channels.slice(0, MAX_PRESENCE_CHANNELS).map((channel) => ({
    id: channel.id,
    label: channel.label,
    state: channel.state.toUpperCase(),
    latency: channel.latencyMs === null ? '—' : `${channel.latencyMs} ms`,
    tone: presenceTone[channel.state],
  })) ?? []

const observedFormatter = Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Los_Angeles',
  timeZoneName: 'short',
})

export const selectObservedAt = (checkedAt: string | undefined): string =>
  match(
    fromNullable(checkedAt),
    (available) => observedFormatter.format(Date.parse(available)),
    () => '—'
  )

export const selectWindow = (
  label: string,
  observatory: PublicObservatory | undefined
): string =>
  observatory
    ? `${label} · ${observatory.window.current.startDate} — ${observatory.window.current.endDate}`
    : label

export const selectFeedProjection = (
  presentation: ObservatoryPresentation,
  input: ObservatorySelectorInput
): ObservatoryFeedProjection =>
  orElse(
    multiMatch<ObservatorySelectorInput, ObservatoryFeedProjection>(input, [
      [
        (candidate) => candidate.observatoryError && Boolean(candidate.observatory),
        () => ({ label: presentation.staleLabel, tone: 'degraded' }),
      ],
      [
        (candidate) => candidate.observatoryError,
        () => ({ label: presentation.unavailableLabel, tone: 'negative' }),
      ],
      [
        (candidate) => candidate.observatoryPending && !candidate.observatory,
        () => ({ label: presentation.syncLabel, tone: 'degraded' }),
      ],
      [
        (candidate) => Boolean(candidate.observatory?.stale),
        () => ({ label: presentation.staleLabel, tone: 'degraded' }),
      ],
      [
        (candidate) => Boolean(candidate.observatory?.availability),
        (candidate) => ({
          label: availabilityLabelOf(
            candidate.observatory?.availability ?? 'unavailable',
            presentation
          ),
          tone: availabilityTone[candidate.observatory?.availability ?? 'unavailable'],
        }),
      ],
      [_, () => ({ label: presentation.syncLabel, tone: 'degraded' })],
    ]),
    { label: presentation.syncLabel, tone: 'degraded' }
  )

type SectionInput = Readonly<{
  pending: boolean
  error: boolean
  available: boolean
  provenance: 'partial' | 'stale' | null
}>

const selectSectionState = (
  presentation: ObservatoryPresentation,
  input: SectionInput
): string | null =>
  orElse(
    multiMatch<SectionInput, string | null>(input, [
      [
        (candidate) => candidate.error && candidate.available,
        () => presentation.staleLabel,
      ],
      [(candidate) => candidate.error, () => presentation.unavailableLabel],
      [
        (candidate) => candidate.pending && !candidate.available,
        () => presentation.syncLabel,
      ],
      [(candidate) => candidate.provenance === 'stale', () => presentation.staleLabel],
      [
        (candidate) => candidate.provenance === 'partial',
        () => presentation.partialLabel,
      ],
      [_, () => null],
    ]),
    null
  )

const githubProvenance = (
  github: GithubSummary | undefined
): SectionInput['provenance'] =>
  orElse(
    multiMatch<GithubSummary | undefined, SectionInput['provenance']>(github, [
      [
        (summary) => Boolean(summary?.stale || summary?.availability?.state === 'stale'),
        () => 'stale',
      ],
      [
        (summary) =>
          Boolean(summary?.partial || summary?.availability?.state === 'partial'),
        () => 'partial',
      ],
      [_, () => null],
    ]),
    null
  )

export const selectImpactState = (
  presentation: ObservatoryPresentation,
  input: ObservatorySelectorInput
): string | null =>
  selectSectionState(presentation, {
    pending: input.githubPending,
    error: input.githubError || input.github?.availability?.state === 'unavailable',
    available: Boolean(input.github),
    provenance: githubProvenance(input.github),
  })

export const selectPresenceState = (
  presentation: ObservatoryPresentation,
  input: ObservatorySelectorInput
): string | null =>
  selectSectionState(presentation, {
    pending: input.presencePending,
    error: input.presenceError,
    available: Boolean(input.presence),
    provenance: input.presence?.stale ? 'stale' : null,
  })
