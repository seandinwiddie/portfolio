import type React from 'react'
import { Anchor, Text, XStack, YStack } from 'tamagui'
import type {
  ProjectCommitArchiveViewModel,
  ProjectCommitViewModel,
} from '../../../../features/systems/portfolio/projects/projects/projectsSelectors'
import Panel from '../../../shared/panel/panelView'

const CommitRow: React.FC<ProjectCommitViewModel> = ({
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

const renderCommits = ([
  commit,
  ...rest
]: readonly ProjectCommitViewModel[]): React.ReactNode =>
  commit ? (
    <>
      <CommitRow {...commit} />
      {renderCommits(rest)}
    </>
  ) : null

const ProjectArchive: React.FC<ProjectCommitArchiveViewModel> = ({ meter, commits }) => (
  <Panel label="Flight recorder" meter={meter}>
    <YStack className="flight-recorder" gap="$1">
      {renderCommits(commits)}
    </YStack>
  </Panel>
)

export default ProjectArchive
