import type React from 'react'
import { Anchor, Text, XStack, YStack } from 'tamagui'
import type {
  MissionCommitArchiveViewModel,
  MissionCommitViewModel,
} from '../../../../features/systems/registry/missions/operations/operationsSelectors'
import Panel from '../../../aperture/panel/panelView'

const CommitRow: React.FC<MissionCommitViewModel> = ({
  sha,
  repo,
  url,
  age,
  subject,
  kind,
}) => (
  <YStack className="flight-recorder-row" gap="$1" paddingVertical="$2">
    <XStack justifyContent="space-between" gap="$3" flexWrap="wrap">
      <XStack gap="$2" flexWrap="wrap" flexShrink={1}>
        <Anchor
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          fontFamily="$heading"
          fontSize="$2"
          textDecorationLine="none"
          minWidth={44}
          minHeight={44}
          display="flex"
          alignItems="center"
        >
          {sha}
        </Anchor>
        <Text fontFamily="$body" fontSize="$2">
          {repo}
        </Text>
      </XStack>
      <Text className="readout-label" fontFamily="$body" fontSize="$1">
        {age}
      </Text>
    </XStack>
    <Text fontFamily="$body" fontSize="$3">
      {subject}
    </Text>
    <Text
      className="readout-label"
      fontFamily="$body"
      fontSize="$1"
      textTransform="uppercase"
      letterSpacing={1}
    >
      {kind}
    </Text>
  </YStack>
)

const renderCommits = (commits: readonly MissionCommitViewModel[]): React.ReactNode =>
  commits.map((commit) => <CommitRow key={commit.id} {...commit} />)

const MissionArchive: React.FC<MissionCommitArchiveViewModel> = ({
  label,
  meter,
  commits,
}) => (
  <Panel label={label} meter={meter}>
    <YStack className="flight-recorder" gap="$1">
      {renderCommits(commits)}
    </YStack>
  </Panel>
)

export default MissionArchive
