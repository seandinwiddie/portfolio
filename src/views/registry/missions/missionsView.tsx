import type React from 'react'
import { Card, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import type {
  MissionsDataViewModel,
  MissionStatViewModel,
  MissionsViewProps,
} from '../../../features/systems/registry/missions/operations/operationsSelectors'
import Panel from '../../aperture/panel/panelView'
import Screen from '../../aperture/screen/screenView'
import SignalLattice from './signalLattice/signalLatticeView'
import MissionActivity from './missionPulse/missionPulseView'
import MissionArchive from './missionArchive/missionArchiveView'
import MissionLanguages from './missionDialects/missionDialectsView'
import MissionOwners from './missionCustodians/missionCustodiansView'

const Stat: React.FC<MissionStatViewModel> = ({ value, label }) => (
  <YStack minWidth={92}>
    <Text fontFamily="$heading" fontSize="$8" fontWeight="bold">
      {value}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$2">
      {label}
    </Text>
  </YStack>
)

const renderStats = (stats: readonly MissionStatViewModel[]): React.ReactNode =>
  stats.map((stat) => <Stat key={stat.id} {...stat} />)

const MissionsData: React.FC<MissionsDataViewModel> = ({
  stats,
  contributionMeter,
  contributionLabel,
  signalLattice,
  commits,
  activity,
  languagesLabel,
  languagesMeter,
  languages,
  owners,
}) => (
  <YStack className="missions-dashboard">
    <XStack className="missions-stats" gap="$5" flexWrap="wrap" rowGap="$3">
      {renderStats(stats)}
    </XStack>
    <YStack className="missions-dashboard-row" minWidth={0}>
      {signalLattice && contributionMeter ? (
        <YStack className="missions-calendar" minWidth={0}>
          <Panel label={contributionLabel} meter={contributionMeter}>
            <SignalLattice {...signalLattice} />
          </Panel>
        </YStack>
      ) : null}
      <YStack className="missions-activity" minWidth={0}>
        <MissionActivity {...activity} />
      </YStack>
    </YStack>
    <YStack className="missions-dashboard-row" minWidth={0}>
      {commits ? (
        <YStack className="missions-recorder" minWidth={0}>
          <MissionArchive {...commits} />
        </YStack>
      ) : null}
      <YStack className="missions-languages" minWidth={0}>
        <MissionLanguages
          label={languagesLabel}
          meter={languagesMeter}
          languages={languages}
        />
      </YStack>
    </YStack>
    <YStack className="missions-owners" minWidth={0}>
      <MissionOwners owners={owners} />
    </YStack>
  </YStack>
)

const Missions: React.FC<MissionsViewProps> = ({
  dataStatus,
  available,
  eyebrow,
  headline,
  statement,
  loadingLabel,
  errorLabel,
  isLoading,
  isError,
  degradedMessage,
  data,
}) => (
  <Screen className="missions-console">
    {available ? (
      <YStack className="missions-intro ignite ignite-1" gap="$2">
        <Text className="system-kicker" fontFamily="$body" fontSize="$1">
          {eyebrow}
        </Text>
        <H1 className="command-headline" fontFamily="$heading">
          {headline}
        </H1>
        <Paragraph fontFamily="$body" opacity={0.8}>
          {statement}
        </Paragraph>
      </YStack>
    ) : null}
    {isLoading ? (
      <XStack className="system-notice" gap="$2" alignItems="center">
        <Spinner />
        <Text fontFamily="$body">{dataStatus.pendingLabel ?? loadingLabel}</Text>
      </XStack>
    ) : null}
    {isError ? (
      <Card className="system-notice" padding="$4" bordered backgroundColor="$surface">
        <Paragraph fontFamily="$body">{dataStatus.errorLabel ?? errorLabel}</Paragraph>
      </Card>
    ) : null}
    {degradedMessage ? (
      <Card
        className="system-notice"
        padding="$4"
        bordered
        tag="output"
        backgroundColor="$surface"
      >
        <Paragraph fontFamily="$body">{degradedMessage}</Paragraph>
      </Card>
    ) : null}
    {dataStatus.staleLabel && !degradedMessage ? (
      <Card className="system-notice" padding="$4" bordered backgroundColor="$surface">
        <Paragraph accessibilityLiveRegion="polite" fontFamily="$body">
          {dataStatus.staleLabel}
        </Paragraph>
      </Card>
    ) : null}
    {data ? <MissionsData {...data} /> : null}
  </Screen>
)

export default Missions
