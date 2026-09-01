export type ObservatoryAvailability =
  | 'available'
  | 'partial'
  | 'unavailable'
  | 'unconfigured'

export type ObservatoryDirection = 'up' | 'flat' | 'down'

export interface ObservatoryDelta {
  readonly absolute: number
  readonly percent: number | null
  readonly direction: ObservatoryDirection
}

export interface ObservatoryWindow {
  readonly startDate: string
  readonly endDate: string
}

export interface AnalyticsAggregate {
  readonly activeUsers: number
  readonly sessions: number
  readonly views: number
}

export type AnalyticsDateSignal = AnalyticsAggregate & {
  readonly date: string
}

export interface AnalyticsSignal {
  readonly availability: ObservatoryAvailability
  readonly realtime: Readonly<{ activeUsers: number }> | null
  readonly current: AnalyticsAggregate | null
  readonly previous: AnalyticsAggregate | null
  readonly trend: Readonly<Record<keyof AnalyticsAggregate, ObservatoryDelta>> | null
  readonly dateTrend: readonly AnalyticsDateSignal[]
}

export interface DiscoveryAggregate {
  readonly clicks: number
  readonly impressions: number
  readonly ctr: number
  readonly position: number
}

export type DiscoveryDateSignal = DiscoveryAggregate & {
  readonly date: string
}

export interface DiscoverySignal {
  readonly availability: ObservatoryAvailability
  readonly current: DiscoveryAggregate | null
  readonly previous: DiscoveryAggregate | null
  readonly dateTrend: readonly DiscoveryDateSignal[]
}

export interface ObservatoryProperty {
  readonly id: string
  readonly label: string
  readonly availability: ObservatoryAvailability
  readonly analytics: AnalyticsSignal
  readonly searchConsole: DiscoverySignal
}

export interface PublicObservatory {
  readonly checkedAt: string
  readonly cached: boolean
  readonly stale: boolean
  readonly availability: ObservatoryAvailability
  readonly window: Readonly<{
    current: ObservatoryWindow
    previous: ObservatoryWindow
  }>
  readonly properties: readonly ObservatoryProperty[]
}

export type PresenceState = 'operational' | 'limited' | 'unreachable'

export interface PresenceChannel {
  readonly id: string
  readonly label: string
  readonly url: string
  readonly state: PresenceState
  readonly httpStatus: number | null
  readonly latencyMs: number | null
  readonly checkedAt: string
}

export interface PublicPresence {
  readonly checkedAt: string
  readonly cached: boolean
  readonly stale: boolean
  readonly summary: Readonly<{
    channels: number
    operational: number
    limited: number
    unreachable: number
  }>
  readonly channels: readonly PresenceChannel[]
}

export type ObservatoryMetricKey =
  | keyof AnalyticsAggregate
  | keyof DiscoveryAggregate
  | 'followers'
  | 'repositories'
  | 'contributions'

export interface ObservatoryPresentation {
  readonly eyebrow: string
  readonly headline: string
  readonly statement: string
  readonly impactLabel: string
  readonly presenceLabel: string
  readonly analyticsLabel: string
  readonly discoveryLabel: string
  readonly windowLabel: string
  readonly baselineLabel: string
  readonly liveLabel: string
  readonly checkedLabel: string
  readonly syncLabel: string
  readonly emptyLabel: string
  readonly partialLabel: string
  readonly staleLabel: string
  readonly unavailableLabel: string
  readonly unconfiguredLabel: string
  readonly metrics: Readonly<Record<ObservatoryMetricKey, string>>
}
