import type React from 'react'
import { Anchor, H1, Paragraph, Separator, Text, XStack, YStack } from 'tamagui'
import type {
  StatusRowViewModel,
  StatusSignalBarViewModel,
  StatusViewProps,
} from '../../../../features/systems/portfolio/diagnostics/status/statusSelectors'
import Panel from '../../../shared/panel/panelView'
import Screen from '../../../shared/screen/screenView'

const SignalBar: React.FC<StatusSignalBarViewModel> = ({ height, color, opacity }) => (
  <YStack width={4} height={height} backgroundColor={color} opacity={opacity} />
)

const renderBars = ([
  bar,
  ...rest
]: readonly StatusSignalBarViewModel[]): React.ReactNode =>
  bar ? (
    <>
      <SignalBar {...bar} />
      {renderBars(rest)}
    </>
  ) : null

const Row: React.FC<StatusRowViewModel> = ({ label, value, glyph, color }) => (
  <XStack justifyContent="space-between" gap="$4" flexWrap="wrap" rowGap="$1">
    <XStack gap="$2" alignItems="center" flexShrink={1}>
      {glyph ? (
        <Text fontFamily="$body" fontSize="$2" color={color ?? undefined}>
          {glyph}
        </Text>
      ) : null}
      <Text
        className="readout-label"
        fontFamily="$body"
        fontSize="$2"
        letterSpacing={2}
        textTransform="uppercase"
      >
        {label}
      </Text>
    </XStack>
    <Text fontFamily="$heading" fontSize="$3" ta="right" flexShrink={1}>
      {value}
    </Text>
  </XStack>
)

const renderRows = ([row, ...rest]: readonly StatusRowViewModel[]): React.ReactNode =>
  row ? (
    <>
      <Row {...row} />
      {renderRows(rest)}
    </>
  ) : null

const Status: React.FC<StatusViewProps> = ({
  allNominal,
  overallGlyph,
  overallHeadline,
  uplink,
  payload,
  theme,
  runtime,
}) => (
  <Screen>
    <YStack className="ignite ignite-1" gap="$3">
      <Text className="readout-label" fontFamily="$body" fontSize="$1" letterSpacing={4}>
        ORBITAL REGISTRY · DIAGNOSTICS
      </Text>
      <XStack gap="$3" alignItems="center" flexWrap="wrap">
        <Text
          className={allNominal ? 'status-live' : ''}
          fontFamily="$heading"
          fontSize="$8"
        >
          {overallGlyph}
        </Text>
        <H1
          className="dossier-headline"
          fontFamily="$heading"
          fontWeight="bold"
          flexShrink={1}
        >
          {overallHeadline}
        </H1>
      </XStack>
      <YStack className="rule" height={1} backgroundColor="$borderColor" width="40%" />
      <Paragraph className="readout-label" fontFamily="$body">
        Measured in this browser, right now — a timed round trip to the API, the live
        Redux store, and your own display preferences. Nothing here is a static badge.
      </Paragraph>
    </YStack>

    <YStack className="stagger-1">
      <Panel label="Uplink" meter={uplink.meter}>
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <XStack gap={3} alignItems="flex-end" height={18}>
              {renderBars(uplink.bars)}
            </XStack>
            <Text fontFamily="$heading" fontSize="$7" fontWeight="bold">
              {uplink.latency}
              <Text className="readout-label" fontFamily="$body" fontSize="$3">
                {' '}
                ms
              </Text>
            </Text>
          </XStack>
          {renderRows(uplink.rows)}
        </YStack>
      </Panel>
    </YStack>

    <YStack className="stagger-2">
      <Panel label="Payload" meter={payload.meter}>
        {payload.empty ? (
          <Text className="readout-label" fontFamily="$body">
            No telemetry — the feed is still syncing.
          </Text>
        ) : (
          <YStack gap="$2">{renderRows(payload.rows)}</YStack>
        )}
      </Panel>
    </YStack>

    <YStack className="stagger-3">
      <Panel label="Theme subsystem" meter={theme.meter}>
        <YStack gap="$2">
          {renderRows(theme.rows)}
          {theme.source ? (
            <Anchor
              href={theme.source}
              target="_blank"
              rel="noopener noreferrer"
              fontFamily="$body"
              fontSize="$2"
              color="$link"
              hoverStyle={{ color: '$linkHover' }}
            >
              {theme.sourceLabel}
            </Anchor>
          ) : null}
        </YStack>
      </Panel>
    </YStack>

    <YStack className="stagger-4">
      <Panel label="Runtime" meter={runtime.meter}>
        <YStack gap="$2">
          {renderRows(runtime.rowsBeforeSeparator)}
          <Separator />
          {renderRows(runtime.rowsAfterSeparator)}
        </YStack>
      </Panel>
    </YStack>
  </Screen>
)

export default Status
