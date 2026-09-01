import { _, multiMatch, orElse } from 'functional-programming-composition'
import type { RuntimeTelemetryPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'

export type FeedState = {
  readonly hasData: boolean
  readonly isPartial: boolean
  readonly isStale: boolean
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
}

const FEED_VALUE_KEYS: Readonly<Record<string, string>> = {
  '001': 'offline',
  '010': 'sync',
  '110': 'refresh',
  '000': 'idle',
  '100': 'live',
  '011': 'offline',
  '101': 'staleUpper',
  '111': 'staleUpper',
}

export const selectFeedLabel =
  (presentation: RuntimeTelemetryPresentation | undefined) =>
  (state: FeedState): string =>
    orElse(
      multiMatch<FeedState, string>(state, [
        [
          ({ hasData, isStale }) => hasData && isStale,
          () => presentation?.values.staleUpper ?? '',
        ],
        [
          ({ hasData, isPartial }) => hasData && isPartial,
          () => presentation?.overall.degraded ?? '',
        ],
        [
          _,
          () => {
            const key =
              FEED_VALUE_KEYS[
                `${Number(state.hasData)}${Number(state.isFetching)}${Number(
                  state.isError
                )}`
              ] ?? 'idle'
            return presentation?.values[key] ?? ''
          },
        ],
      ]),
      ''
    )

const selectFeedBaseLabel = (
  presentation: RuntimeTelemetryPresentation | undefined
): string => {
  const label = presentation?.labels.feed ?? ''
  const liveSuffix = ` ${presentation?.values.live ?? ''}`

  return label.endsWith(liveSuffix) ? label.slice(0, -liveSuffix.length) : label
}

export const selectTelemetryViewModel =
  (theme: string, feed: FeedState) =>
  (presentation: RuntimeTelemetryPresentation | undefined): TelemetryViewProps => ({
    feed: {
      label: selectFeedBaseLabel(presentation),
      value: selectFeedLabel(presentation)(feed),
    },
    theme: {
      label: presentation?.labels.theme ?? '',
      value: theme.toUpperCase(),
    },
  })
