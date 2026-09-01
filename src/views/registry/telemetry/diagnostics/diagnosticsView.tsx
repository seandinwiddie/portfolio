import type React from 'react'
import { Anchor, H1, Paragraph, Separator, Text, XStack, YStack } from 'tamagui'
import type {
  TelemetryDataViewProps,
  TelemetryRowViewModel,
  TelemetrySignalBarViewModel,
  TelemetryViewProps,
} from '../../../../features/systems/registry/telemetry/diagnostics/diagnosticsSelectors'
import Panel from '../../../aperture/panel/panelView'
import Screen from '../../../aperture/screen/screenView'

const SignalBar: React.FC<TelemetrySignalBarViewModel> = ({ height, color, opacity }) => (
  <YStack width={4} height={height} backgroundColor={color} opacity={opacity} />
)

const renderBars = (bars: readonly TelemetrySignalBarViewModel[]): React.ReactNode =>
  bars.map((bar) => <SignalBar key={bar.id} {...bar} />)

const Row: React.FC<TelemetryRowViewModel> = ({ label, value, glyph, color }) => (
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

const renderRows = (rows: readonly TelemetryRowViewModel[]): React.ReactNode =>
  rows.map((row) => <Row key={row.id} {...row} />)

const TelemetryData: React.FC<TelemetryDataViewProps> = ({
  staleLabel,
  eyebrow,
  statement,
  panels,
  latencyUnit,
  emptyLabel,
  allNominal,
  overallGlyph,
  overallHeadline,
  uplink,
  payload,
  theme,
  runtime,
}) => (
  <Screen className="telemetry-console">
    {staleLabel ? (
      <YStack className="system-notice" padding="$4">
        <Paragraph accessibilityLiveRegion="polite" fontFamily="$body">
          {staleLabel}
        </Paragraph>
      </YStack>
    ) : null}
    <YStack className="telemetry-intro ignite ignite-1" gap="$3">
      <Text className="readout-label" fontFamily="$body" fontSize="$1" letterSpacing={4}>
        {eyebrow}
      </Text>
      <XStack gap="$3" alignItems="center" flexWrap="wrap">
        <Text
          className={allNominal ? 'telemetry-live' : ''}
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
        {statement}
      </Paragraph>
    </YStack>

    <YStack className="telemetry-uplink stagger-1" minWidth={0}>
      <Panel label={panels.uplink} meter={uplink.meter}>
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <XStack gap={3} alignItems="flex-end" height={18}>
              {renderBars(uplink.bars)}
            </XStack>
            <Text fontFamily="$heading" fontSize="$7" fontWeight="bold">
              {uplink.latency}
              <Text className="readout-label" fontFamily="$body" fontSize="$3">
                {' '}
                {latencyUnit}
              </Text>
            </Text>
          </XStack>
          {renderRows(uplink.rows)}
        </YStack>
      </Panel>
    </YStack>

    <YStack className="telemetry-payload stagger-2" minWidth={0}>
      <Panel label={panels.payload} meter={payload.meter}>
        {payload.empty ? (
          <Text className="readout-label" fontFamily="$body">
            {emptyLabel}
          </Text>
        ) : (
          <YStack gap="$2">{renderRows(payload.rows)}</YStack>
        )}
      </Panel>
    </YStack>

    <YStack className="telemetry-theme stagger-3" minWidth={0}>
      <Panel label={panels.theme} meter={theme.meter}>
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
              minWidth={44}
              minHeight={44}
              display="flex"
              alignItems="center"
              hoverStyle={{ color: '$linkHover' }}
            >
              {theme.sourceLabel}
            </Anchor>
          ) : null}
        </YStack>
      </Panel>
    </YStack>

    <YStack className="telemetry-runtime stagger-4" minWidth={0}>
      <Panel label={panels.runtime} meter={runtime.meter}>
        <YStack gap="$2">
          {renderRows(runtime.rowsBeforeSeparator)}
          <Separator />
          {renderRows(runtime.rowsAfterSeparator)}
        </YStack>
      </Panel>
    </YStack>
  </Screen>
)

const Telemetry: React.FC<TelemetryViewProps> = ({ dataStatus, ...model }) => {
  const notice = dataStatus.pendingLabel ?? dataStatus.errorLabel
  return notice ? (
    <Screen className="telemetry-console">
      <YStack className="system-notice" padding="$4">
        <Paragraph fontFamily="$body">{notice}</Paragraph>
      </YStack>
    </Screen>
  ) : (
    <TelemetryData {...model} staleLabel={dataStatus.staleLabel ?? null} />
  )
}

export default Telemetry
