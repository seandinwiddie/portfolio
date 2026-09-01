import type React from 'react'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { Anchor, H2, H3, Paragraph, Text, XStack, YStack } from 'tamagui'
import type {
  ObservatoryCapabilityViewModel,
  ObservatoryChartViewModel,
  ObservatoryEstatePresenceViewModel,
  ObservatoryEstateRepositoryViewModel,
  ObservatoryEstateViewModel,
  ObservatoryMetricViewModel,
  ObservatoryViewProps,
  PresenceChannelViewModel,
} from '../../../../features/systems/registry/observatory/signalArray/signalArraySelectors'

const Metric: React.FC<ObservatoryMetricViewModel> = ({
  id,
  label,
  value,
  baseline,
  delta,
  tone,
}) => (
  <YStack className={`observatory-metric signal-tone-${tone}`} data-signal={id}>
    <Text className="system-kicker observatory-metric-label" fontFamily="$body">
      {label}
    </Text>
    <XStack className="observatory-metric-value-row" alignItems="baseline" gap="$2">
      <Text className="observatory-metric-value" fontFamily="$heading" fontWeight="bold">
        {value}
      </Text>
      {delta ? (
        <Text className="observatory-delta" fontFamily="$body">
          {delta}
        </Text>
      ) : null}
    </XStack>
    {baseline ? (
      <Text className="readout-label observatory-baseline" fontFamily="$body">
        {baseline}
      </Text>
    ) : null}
  </YStack>
)

const renderMetrics = (metrics: readonly ObservatoryMetricViewModel[]): React.ReactNode =>
  metrics.map((metric) => <Metric key={metric.id} {...metric} />)

const TrendChart: React.FC<ObservatoryChartViewModel> = ({
  label,
  accessibilityLabel,
  path,
  areaPath,
  points,
  stroke,
  fill,
  axisInk,
  empty,
}) => {
  const terminal = points.at(-1)
  return empty ? null : (
    <YStack className="observatory-chart" gap="$1">
      <Text className="system-kicker observatory-chart-label" fontFamily="$body">
        {label}
      </Text>
      <Svg
        width="100%"
        height={72}
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <Line x1={0} y1={31} x2={100} y2={31} stroke={axisInk} strokeWidth={0.5} />
        <Path d={areaPath} fill={fill} opacity={0.2} />
        <Path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        {terminal ? (
          <Circle cx={terminal.x} cy={terminal.y} r={1.8} fill={stroke} />
        ) : null}
      </Svg>
    </YStack>
  )
}

const Capability: React.FC<ObservatoryCapabilityViewModel> = ({
  label,
  availability,
  availabilityLabel,
  tone,
  metrics,
  chart,
}) => (
  <YStack
    className={`observatory-capability signal-tone-${tone}`}
    dataSet={{ capabilityStatus: availability }}
    gap="$2"
  >
    <XStack justifyContent="space-between" alignItems="center" gap="$2">
      <Text className="system-kicker" fontFamily="$body">
        {label}
      </Text>
      <Text className="observatory-capability-state" fontFamily="$body">
        {availabilityLabel}
      </Text>
    </XStack>
    <YStack className="observatory-metric-grid">{renderMetrics(metrics)}</YStack>
    <TrendChart {...chart} />
  </YStack>
)

const EstatePresence: React.FC<ObservatoryEstatePresenceViewModel> = ({
  label,
  availability,
  state,
  checkedAt,
  observed,
  latency,
  httpStatus,
  tone,
}) => (
  <XStack
    className={`observatory-estate-presence signal-tone-${tone}`}
    dataSet={{ capabilityStatus: availability, observedAt: checkedAt ?? '' }}
    justifyContent="space-between"
    alignItems="center"
    gap="$3"
  >
    <YStack minWidth={0} gap="$1">
      <Text className="system-kicker" fontFamily="$body">
        {label}
      </Text>
      <Text className="observatory-presence-state" fontFamily="$body">
        {state}
      </Text>
      <Text className="readout-label observatory-estate-observed" fontFamily="$body">
        {observed}
      </Text>
    </YStack>
    <YStack alignItems="flex-end" gap="$1">
      <Text className="observatory-estate-latency" fontFamily="$body">
        {latency}
      </Text>
      <Text className="readout-label" fontFamily="$body">
        {httpStatus}
      </Text>
    </YStack>
  </XStack>
)

const EstateRepository: React.FC<ObservatoryEstateRepositoryViewModel> = ({
  id,
  label,
  url,
  status,
  statusLabel,
}) => (
  <XStack
    testID={`estate-repository-${id}`}
    dataSet={{ repositoryId: id, repositoryStatus: status }}
    className="observatory-estate-repository"
    justifyContent="space-between"
    alignItems="center"
    gap="$2"
  >
    <Anchor
      className="observatory-estate-repository-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <Text className="registry-link-arrow" aria-hidden={true}>
        ↗
      </Text>
    </Anchor>
    <Text className="readout-label observatory-estate-repository-status">
      {statusLabel}
    </Text>
  </XStack>
)

const renderRepositories = (
  repositories: readonly ObservatoryEstateRepositoryViewModel[]
): React.ReactNode =>
  repositories.map((repository) => (
    <EstateRepository key={repository.id} {...repository} />
  ))

const Estate: React.FC<ObservatoryEstateViewModel> = ({
  id,
  label,
  url,
  window,
  instrumented,
  availabilityLabel,
  tone,
  presence,
  repositoriesLabel,
  repositories,
  live,
  analytics,
  discovery,
  baselineRecorded,
  baselineLabel,
}) => (
  <YStack
    id={`estate-${id}`}
    testID={`estate-${id}`}
    tag="section"
    aria-labelledby={`estate-${id}-heading`}
    dataSet={{
      estateId: id,
      instrumented: String(instrumented),
      presenceStatus: presence.availability,
      analyticsStatus: analytics.availability,
      searchConsoleStatus: discovery.availability,
      sourceEndpoint: '/observatory',
      observationPeriod: window,
    }}
    className={`observatory-property panel-frame signal-tone-${tone} ${
      instrumented
        ? 'observatory-property-instrumented'
        : 'observatory-property-uninstrumented'
    }`}
    gap="$3"
  >
    <XStack className="system-panel-header" justifyContent="space-between" gap="$3">
      <H3 id={`estate-${id}-heading`} fontFamily="$heading" fontWeight="bold">
        <Anchor
          className="observatory-estate-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
          <Text className="registry-link-arrow" aria-hidden={true}>
            ↗
          </Text>
        </Anchor>
      </H3>
      <Text className="observatory-availability" fontFamily="$body">
        {availabilityLabel}
      </Text>
    </XStack>
    <Text className="readout-label observatory-estate-window" fontFamily="$body">
      {window}
    </Text>
    <EstatePresence {...presence} />
    {repositories.length > 0 ? (
      <YStack
        tag="nav"
        aria-labelledby={`estate-${id}-repositories-heading`}
        className="observatory-estate-repositories"
        gap="$1"
      >
        <Text
          id={`estate-${id}-repositories-heading`}
          className="system-kicker"
          fontFamily="$body"
        >
          {repositoriesLabel}
        </Text>
        {renderRepositories(repositories)}
      </YStack>
    ) : null}
    {live ? <Metric {...live} /> : null}
    <Capability {...analytics} />
    <Capability {...discovery} />
    {baselineRecorded ? (
      <Text className="observatory-baseline-recorded" fontFamily="$body">
        {baselineLabel}
      </Text>
    ) : null}
  </YStack>
)

const renderEstates = (estates: readonly ObservatoryEstateViewModel[]): React.ReactNode =>
  estates.map((estate) => <Estate key={estate.id} {...estate} />)

const PresenceChannel: React.FC<PresenceChannelViewModel> = ({
  id,
  label,
  state,
  latency,
  tone,
}) => (
  <XStack
    className={`observatory-presence-channel signal-tone-${tone}`}
    data-signal={id}
    justifyContent="space-between"
    alignItems="center"
    gap="$2"
  >
    <YStack minWidth={0}>
      <Text className="observatory-presence-label" fontFamily="$body">
        {label}
      </Text>
      <Text className="observatory-presence-state" fontFamily="$body">
        {state}
      </Text>
    </YStack>
    <Text className="readout-label" fontFamily="$body">
      {latency}
    </Text>
  </XStack>
)

const renderPresence = (channels: readonly PresenceChannelViewModel[]): React.ReactNode =>
  channels.map((channel) => <PresenceChannel key={channel.id} {...channel} />)

const Observatory: React.FC<ObservatoryViewProps> = ({
  dataStatus,
  visible,
  eyebrow,
  headline,
  statement,
  impactLabel,
  presenceLabel,
  window,
  observed,
  feedLabel,
  feedTone,
  impact,
  impactState,
  estates,
  presence,
  presenceState,
}) =>
  visible ? (
    <YStack className="observatory-deck ignite ignite-3" gap="$3">
      <YStack className="observatory-header panel-frame" gap="$2">
        <XStack className="system-panel-header" justifyContent="space-between" gap="$3">
          <Text className="system-kicker" fontFamily="$body">
            {eyebrow}
          </Text>
          <Text
            className={`observatory-feed signal-tone-${feedTone}`}
            fontFamily="$body"
            accessibilityLiveRegion="polite"
          >
            {feedLabel}
          </Text>
        </XStack>
        <H2 className="observatory-headline" fontFamily="$heading" fontWeight="bold">
          {headline}
        </H2>
        <Paragraph className="observatory-statement" fontFamily="$body">
          {statement}
        </Paragraph>
        <XStack className="observatory-timebase" justifyContent="space-between" gap="$3">
          <Text className="readout-label" fontFamily="$body">
            {window}
          </Text>
          <Text className="readout-label" fontFamily="$body">
            {observed}
          </Text>
        </XStack>
        {dataStatus.pendingLabel ? <Text>{dataStatus.pendingLabel}</Text> : null}
        {dataStatus.errorLabel ? <Text role="alert">{dataStatus.errorLabel}</Text> : null}
        {dataStatus.staleLabel ? (
          <Text accessibilityLiveRegion="polite">{dataStatus.staleLabel}</Text>
        ) : null}
      </YStack>
      <YStack className="observatory-impact panel-frame" gap="$2">
        <Text className="system-kicker" fontFamily="$body">
          {impactLabel}
        </Text>
        {impactState ? <Text className="readout-label">{impactState}</Text> : null}
        <YStack className="observatory-impact-grid">{renderMetrics(impact)}</YStack>
      </YStack>
      <YStack className="observatory-presence panel-frame" gap="$2">
        <Text className="system-kicker" fontFamily="$body">
          {presenceLabel}
        </Text>
        {presenceState ? <Text className="readout-label">{presenceState}</Text> : null}
        <YStack className="observatory-presence-grid">{renderPresence(presence)}</YStack>
      </YStack>
      {renderEstates(estates)}
    </YStack>
  ) : null

export default Observatory
