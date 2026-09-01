import { fromNullable, match } from 'functional-programming-composition'
import type {
  AnalyticsAggregate,
  DiscoveryAggregate,
  EstateAnalyticsCapability,
  EstateDiscoveryCapability,
  EstatePresenceCapability,
  ObservatoryAvailability,
  ObservatoryDelta,
  ObservatoryMetricKey,
  ObservatoryPresentation,
  PublicObservatory,
} from '../../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { ThemeVisualization } from '../../../../../../styles/themes/themeTypes'
import type {
  ObservatoryCapabilityViewModel,
  ObservatoryChartViewModel,
  ObservatoryEstatePresenceViewModel,
  ObservatoryEstateRepositoryViewModel,
  ObservatoryEstateViewModel,
  ObservatoryMetricViewModel,
  ObservatoryTone,
} from '../signalArraySelectors'

type MetricDefinition<Aggregate> = {
  readonly key: ObservatoryMetricKey
  readonly read: (aggregate: Aggregate) => number
  readonly format: (value: number) => string
  readonly invertGrowth?: boolean
}

type ChartPalette = {
  readonly stroke: string
  readonly fill: string
  readonly axisInk: string
}

type InstrumentedAnalyticsCapability = Extract<
  EstateAnalyticsCapability,
  Readonly<{ instrumented: true }>
>

type InstrumentedDiscoveryCapability = Extract<
  EstateDiscoveryCapability,
  Readonly<{ instrumented: true }>
>

type InstrumentedPresenceCapability = Extract<
  EstatePresenceCapability,
  Readonly<{ instrumented: true }>
>

type EstateInstrumentationPartitions = Readonly<{
  true: readonly ObservatoryEstateViewModel[]
  false: readonly ObservatoryEstateViewModel[]
}>

const integer = (value: number): string => Math.round(value).toLocaleString()
const percent = (value: number): string => `${(value * 100).toFixed(1)}%`
const decimal = (value: number): string => value.toFixed(1)

const ANALYTICS_METRICS: readonly MetricDefinition<AnalyticsAggregate>[] = [
  { key: 'activeUsers', read: ({ activeUsers }) => activeUsers, format: integer },
  { key: 'sessions', read: ({ sessions }) => sessions, format: integer },
  { key: 'views', read: ({ views }) => views, format: integer },
]

const DISCOVERY_METRICS: readonly MetricDefinition<DiscoveryAggregate>[] = [
  { key: 'clicks', read: ({ clicks }) => clicks, format: integer },
  { key: 'impressions', read: ({ impressions }) => impressions, format: integer },
  { key: 'ctr', read: ({ ctr }) => ctr, format: percent },
  {
    key: 'position',
    read: ({ position }) => position,
    format: decimal,
    invertGrowth: true,
  },
]

const directionBySign = {
  '-1': 'down',
  0: 'flat',
  1: 'up',
} as const

const zeroBaselinePercent = {
  '-1': null,
  0: 0,
  1: null,
} as const

export const selectObservatoryDelta = (
  current: number,
  previous: number
): ObservatoryDelta => {
  const absolute = current - previous
  const sign = String(Math.sign(absolute)) as keyof typeof directionBySign
  return {
    absolute,
    percent: previous === 0 ? zeroBaselinePercent[sign] : (absolute / previous) * 100,
    direction: directionBySign[sign],
  }
}

const toneOfDelta = (delta: ObservatoryDelta, invertGrowth = false): ObservatoryTone => {
  const direction = invertGrowth
    ? ({ up: 'down', down: 'up', flat: 'flat' } as const)[delta.direction]
    : delta.direction
  return ({ up: 'positive', down: 'negative', flat: 'neutral' } as const)[direction]
}

const deltaLabel = (delta: ObservatoryDelta): string =>
  delta.percent === null
    ? `${delta.absolute > 0 ? '+' : ''}${integer(delta.absolute)} new`
    : `${delta.percent > 0 ? '+' : ''}${delta.percent.toFixed(1)}%`

const priorMetricOf = <Aggregate>(
  previous: Aggregate | null,
  definition: MetricDefinition<Aggregate>
): number | undefined => match(fromNullable(previous), definition.read, () => undefined)

const metricsOf =
  <Aggregate>(
    definitions: readonly MetricDefinition<Aggregate>[],
    labels: Readonly<Record<ObservatoryMetricKey, string>>
  ) =>
  (current: Aggregate | null, previous: Aggregate | null) =>
  (baselineLabel: string): readonly ObservatoryMetricViewModel[] =>
    match<Aggregate, readonly ObservatoryMetricViewModel[]>(
      fromNullable(current),
      (available) =>
        definitions.map((definition): ObservatoryMetricViewModel => {
          const value = definition.read(available)
          const prior = priorMetricOf(previous, definition)
          const delta = prior === undefined ? null : selectObservatoryDelta(value, prior)
          return {
            id: definition.key,
            label: labels[definition.key],
            value: definition.format(value),
            baseline:
              prior === undefined ? null : `${baselineLabel} ${definition.format(prior)}`,
            delta: delta ? deltaLabel(delta) : null,
            tone: delta ? toneOfDelta(delta, definition.invertGrowth) : 'neutral',
          }
        }),
      () => []
    )

const chartOf =
  (id: string, label: string) =>
  (
    datedValues: readonly Readonly<{ date: string; value: number }>[],
    palette: ChartPalette
  ): ObservatoryChartViewModel => {
    const values = datedValues.map(({ value }) => value)
    const floor = Math.min(...values, 0)
    const ceiling = Math.max(...values, 0)
    const span = Math.max(ceiling - floor, 1)
    const lastIndex = Math.max(datedValues.length - 1, 1)
    const points = datedValues.map(({ date, value }, index) => ({
      id: date,
      x: Number(((index / lastIndex) * 100).toFixed(2)),
      y: Number((28 - ((value - floor) / span) * 24).toFixed(2)),
    }))
    const path = points
      .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`)
      .join(' ')
    const firstDate = datedValues[0]?.date ?? ''
    const lastDate = datedValues.at(-1)?.date ?? ''
    const latest = datedValues.at(-1)?.value ?? 0
    return {
      id,
      label,
      accessibilityLabel: `${label}: ${integer(latest)}, ${firstDate} through ${lastDate}`,
      path,
      areaPath: path.length > 0 ? `${path} L100 32 L0 32 Z` : '',
      points,
      stroke: palette.stroke,
      fill: palette.fill,
      axisInk: palette.axisInk,
      empty: datedValues.length === 0,
    }
  }

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

const allZero = (values: readonly ObservatoryMetricViewModel[]): boolean =>
  values.length > 0 && values.every(({ value }) => Number.parseFloat(value) === 0)

const machineLabelOf = (availability: string): string =>
  availability.replaceAll('-', ' ').toUpperCase()

const estateObservedFormatter = Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Los_Angeles',
  timeZoneName: 'short',
})

const observedAt = (checkedAt: string): string =>
  estateObservedFormatter.format(Date.parse(checkedAt))

const presenceTone: Readonly<
  Record<EstatePresenceCapability['availability'], ObservatoryTone>
> = {
  operational: 'positive',
  limited: 'degraded',
  unreachable: 'negative',
  'not-instrumented': 'neutral',
}

const presenceOf =
  (presentation: ObservatoryPresentation) =>
  (capability: EstatePresenceCapability): ObservatoryEstatePresenceViewModel =>
    match<InstrumentedPresenceCapability, ObservatoryEstatePresenceViewModel>(
      fromNullable<InstrumentedPresenceCapability>(
        capability.instrumented ? capability : null
      ),
      (signal) => ({
        label: presentation.presenceLabel,
        availability: signal.availability,
        state: machineLabelOf(signal.availability),
        checkedAt: signal.checkedAt,
        observed: match(
          fromNullable(signal.checkedAt),
          (checkedAt) => `${presentation.checkedLabel} ${observedAt(checkedAt)}`,
          () => presentation.unavailableLabel
        ),
        latency: signal.latencyMs === null ? '—' : `${signal.latencyMs} ms`,
        httpStatus: signal.httpStatus === null ? '—' : `HTTP ${signal.httpStatus}`,
        tone: presenceTone[signal.availability],
      }),
      () => ({
        label: presentation.presenceLabel,
        availability: capability.availability,
        state: machineLabelOf(capability.availability),
        checkedAt: null,
        observed: presentation.unconfiguredLabel,
        latency: '—',
        httpStatus: '—',
        tone: presenceTone[capability.availability],
      })
    )

const repositoryOf = (
  repository: PublicObservatory['estates'][number]['repositories'][number]
): ObservatoryEstateRepositoryViewModel => ({
  id: repository.id,
  label: repository.id,
  url: repository.sourceUrl,
  status: repository.status,
  statusLabel: machineLabelOf(repository.status),
})

const audiencePaletteOf = (visualization: ThemeVisualization): ChartPalette => ({
  stroke: visualization.contributionRamp[4],
  fill: visualization.contributionRamp[1],
  axisInk: visualization.axisInk,
})

const discoveryPaletteOf = (visualization: ThemeVisualization): ChartPalette => ({
  stroke: visualization.contributionRamp[3],
  fill: visualization.contributionRamp[1],
  axisInk: visualization.axisInk,
})

const emptyChartOf =
  (id: string) =>
  (label: string) =>
  (palette: ChartPalette): ObservatoryChartViewModel =>
    chartOf(id, label)([], palette)

const analyticsOf =
  (presentation: ObservatoryPresentation) =>
  (visualization: ThemeVisualization) =>
  (estateId: string) =>
  (capability: EstateAnalyticsCapability): ObservatoryCapabilityViewModel =>
    match<InstrumentedAnalyticsCapability, ObservatoryCapabilityViewModel>(
      fromNullable<InstrumentedAnalyticsCapability>(
        capability.instrumented ? capability : null
      ),
      (signal) => ({
        label: presentation.analyticsLabel,
        availability: signal.availability,
        availabilityLabel: availabilityLabelOf(signal.availability, presentation),
        tone: availabilityTone[signal.availability],
        metrics: metricsOf(ANALYTICS_METRICS, presentation.metrics)(
          signal.current ?? null,
          signal.previous ?? null
        )(presentation.baselineLabel),
        chart: chartOf(`${estateId}-audience`, presentation.metrics.views)(
          (signal.dateTrend ?? []).map(({ date, views }) => ({ date, value: views })),
          audiencePaletteOf(visualization)
        ),
      }),
      () => ({
        label: presentation.analyticsLabel,
        availability: capability.availability,
        availabilityLabel: machineLabelOf(capability.availability),
        tone: 'neutral',
        metrics: [],
        chart: emptyChartOf(`${estateId}-audience`)(presentation.metrics.views)(
          audiencePaletteOf(visualization)
        ),
      })
    )

const discoveryOf =
  (presentation: ObservatoryPresentation) =>
  (visualization: ThemeVisualization) =>
  (estateId: string) =>
  (capability: EstateDiscoveryCapability): ObservatoryCapabilityViewModel =>
    match<InstrumentedDiscoveryCapability, ObservatoryCapabilityViewModel>(
      fromNullable<InstrumentedDiscoveryCapability>(
        capability.instrumented ? capability : null
      ),
      (signal) => ({
        label: presentation.discoveryLabel,
        availability: signal.availability,
        availabilityLabel: availabilityLabelOf(signal.availability, presentation),
        tone: availabilityTone[signal.availability],
        metrics: metricsOf(DISCOVERY_METRICS, presentation.metrics)(
          signal.current ?? null,
          signal.previous ?? null
        )(presentation.baselineLabel),
        chart: chartOf(`${estateId}-discovery`, presentation.metrics.impressions)(
          (signal.dateTrend ?? []).map(({ date, impressions }) => ({
            date,
            value: impressions,
          })),
          discoveryPaletteOf(visualization)
        ),
      }),
      () => ({
        label: presentation.discoveryLabel,
        availability: capability.availability,
        availabilityLabel: machineLabelOf(capability.availability),
        tone: 'neutral',
        metrics: [],
        chart: emptyChartOf(`${estateId}-discovery`)(presentation.metrics.impressions)(
          discoveryPaletteOf(visualization)
        ),
      })
    )

const liveOf =
  (presentation: ObservatoryPresentation) =>
  (estateId: string) =>
  (capability: EstateAnalyticsCapability): ObservatoryMetricViewModel | null =>
    match(
      fromNullable(capability.instrumented ? capability.realtime : null),
      (realtime) => ({
        id: `${estateId}-live`,
        label: presentation.liveLabel,
        value: integer(realtime.activeUsers),
        baseline: null,
        delta: null,
        tone: realtime.activeUsers > 0 ? 'positive' : 'neutral',
      }),
      () => null
    )

const estateOf =
  (presentation: ObservatoryPresentation) =>
  (visualization: ThemeVisualization) =>
  (window: string) =>
  (estate: PublicObservatory['estates'][number]): ObservatoryEstateViewModel => {
    const presence = presenceOf(presentation)(estate.capabilities.presence)
    const analytics = analyticsOf(presentation)(visualization)(estate.id)(
      estate.capabilities.analytics
    )
    const discovery = discoveryOf(presentation)(visualization)(estate.id)(
      estate.capabilities.searchConsole
    )
    return {
      id: estate.id,
      label: estate.label,
      url: estate.url,
      window,
      instrumented:
        estate.capabilities.analytics.instrumented ||
        estate.capabilities.searchConsole.instrumented,
      availabilityLabel: presence.state,
      tone: presence.tone,
      presence,
      repositoriesLabel: presentation.metrics.repositories,
      repositories: estate.repositories.map(repositoryOf),
      live: liveOf(presentation)(estate.id)(estate.capabilities.analytics),
      analytics,
      discovery,
      baselineRecorded: allZero([...analytics.metrics, ...discovery.metrics]),
      baselineLabel: presentation.emptyLabel,
    }
  }

const appendToInstrumentationPartition = (
  partitions: EstateInstrumentationPartitions,
  estate: ObservatoryEstateViewModel
): EstateInstrumentationPartitions => {
  const key = String(estate.instrumented) as keyof EstateInstrumentationPartitions
  return {
    ...partitions,
    [key]: [...partitions[key], estate],
  }
}

const instrumentedFirst = (
  estates: readonly ObservatoryEstateViewModel[]
): readonly ObservatoryEstateViewModel[] => {
  const partitions = estates.reduce<EstateInstrumentationPartitions>(
    appendToInstrumentationPartition,
    { true: [], false: [] }
  )
  return [...partitions.true, ...partitions.false]
}

export const selectEstateProjections =
  (presentation: ObservatoryPresentation, visualization: ThemeVisualization) =>
  (window: string) =>
  (estates: PublicObservatory['estates']): readonly ObservatoryEstateViewModel[] =>
    instrumentedFirst(estates.map(estateOf(presentation)(visualization)(window)))
