import type React from 'react'
import { XStack, Text } from 'tamagui'
import type {
  TelemetryCellViewProps,
  TelemetryViewProps,
} from '../../../../features/systems/shell/frame/telemetry/telemetrySelectors'

/**
 * A telemetry rail: the ship-instrument strip that runs under the nav.
 *
 * Every readout is live state, not decoration — the active theme, whether the
 * GitHub feed state and active appearance controls. Deeper counts belong to
 * their pages, so each permanent readout carries unique information.
 */
const Cell: React.FC<TelemetryCellViewProps> = ({ label, value }) => (
  <XStack gap="$2" alignItems="center">
    <Text
      className="readout-label"
      fontFamily="$body"
      fontSize="$1"
      letterSpacing={2}
      textTransform="uppercase"
    >
      {label}
    </Text>
    <Text fontFamily="$body" fontSize="$1" letterSpacing={1}>
      {value}
    </Text>
  </XStack>
)

const Telemetry: React.FC<TelemetryViewProps> = ({ feed, theme, experience }) => (
  <XStack
    className="telemetry"
    position="relative"
    paddingHorizontal="$4"
    paddingVertical="$1"
    gap="$5"
    flexWrap="wrap"
    rowGap="$1"
    backgroundColor="$surface"
    tag="output"
    aria-live="polite"
  >
    <Cell {...feed} />
    <Cell {...theme} />
    <Cell {...experience} />
  </XStack>
)

export default Telemetry
