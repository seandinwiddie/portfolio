import { fromNullable, match } from 'functional-programming-composition'
import type {
  AnalyticsAggregate,
  DiscoveryAggregate,
  ObservatoryAvailability,
  ObservatoryDelta,
  ObservatoryMetricKey,
  ObservatoryPresentation,
  PublicObservatory,
} from '../../../../../components/registry/observatory/signalArray/signalArrayTypes'
import type { ThemeVisualization } from '../../../../../../styles/themes/themeTypes'
import type {
  ObservatoryChartViewModel,
  ObservatoryMetricViewModel,
  ObservatoryPropertyViewModel,
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
    match(
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

const propertyOf =
  (presentation: ObservatoryPresentation, visualization: ThemeVisualization) =>
  (property: PublicObservatory['properties'][number]): ObservatoryPropertyViewModel => {
    const analytics = metricsOf(ANALYTICS_METRICS, presentation.metrics)(
      property.analytics.current,
      property.analytics.previous
    )(presentation.baselineLabel)
    const discovery = metricsOf(DISCOVERY_METRICS, presentation.metrics)(
      property.searchConsole.current,
      property.searchConsole.previous
    )(presentation.baselineLabel)
    const audiencePalette = {
      stroke: visualization.contributionRamp[4],
      fill: visualization.contributionRamp[1],
      axisInk: visualization.axisInk,
    }
    const discoveryPalette = {
      stroke: visualization.contributionRamp[3],
      fill: visualization.contributionRamp[1],
      axisInk: visualization.axisInk,
    }
    return {
      id: property.id,
      label: property.label,
      availabilityLabel: availabilityLabelOf(property.availability, presentation),
      tone: availabilityTone[property.availability],
      live: property.analytics.realtime
        ? {
            id: `${property.id}-live`,
            label: presentation.liveLabel,
            value: integer(property.analytics.realtime.activeUsers),
            baseline: null,
            delta: null,
            tone: property.analytics.realtime.activeUsers > 0 ? 'positive' : 'neutral',
          }
        : null,
      analyticsLabel: presentation.analyticsLabel,
      analytics,
      analyticsChart: chartOf(`${property.id}-audience`, presentation.metrics.views)(
        property.analytics.dateTrend.map(({ date, views }) => ({ date, value: views })),
        audiencePalette
      ),
      discoveryLabel: presentation.discoveryLabel,
      discovery,
      discoveryChart: chartOf(
        `${property.id}-discovery`,
        presentation.metrics.impressions
      )(
        property.searchConsole.dateTrend.map(({ date, impressions }) => ({
          date,
          value: impressions,
        })),
        discoveryPalette
      ),
      baselineRecorded: allZero([...analytics, ...discovery]),
      baselineLabel: presentation.emptyLabel,
    }
  }

export const selectPropertyProjections =
  (presentation: ObservatoryPresentation, visualization: ThemeVisualization) =>
  (
    properties: PublicObservatory['properties']
  ): readonly ObservatoryPropertyViewModel[] =>
    properties.map(propertyOf(presentation, visualization))
