export type FeedState = {
  readonly hasData: boolean
  readonly isFetching: boolean
  readonly isError: boolean
}

export type TelemetryCellViewProps = {
  readonly label: string
  readonly value: string
}

export type TelemetryViewProps = {
  readonly feed: TelemetryCellViewProps
  readonly theme: TelemetryCellViewProps
  readonly experience: TelemetryCellViewProps
}

type TelemetryProjection = {
  readonly experience: string
  readonly feed: FeedState
}

const FEED_LABELS: Readonly<Record<string, string>> = {
  '001': 'OFFLINE',
  '010': 'SYNC',
  '110': 'REFRESH',
  '000': 'IDLE',
  '100': 'LIVE',
  '011': 'OFFLINE',
  '101': 'OFFLINE',
  '111': 'OFFLINE',
}

export const selectFeedLabel = ({ hasData, isFetching, isError }: FeedState): string =>
  FEED_LABELS[`${Number(hasData)}${Number(isFetching)}${Number(isError)}`] ?? 'IDLE'

export const selectTelemetryViewModel = (
  theme: string,
  projection: TelemetryProjection
): TelemetryViewProps => ({
  feed: {
    label: 'github feed',
    value: selectFeedLabel(projection.feed),
  },
  theme: { label: 'theme', value: theme.toUpperCase() },
  experience: { label: 'fx', value: projection.experience.toUpperCase() },
})
