import type React from 'react'
import { Anchor, Text, XStack, YStack } from 'tamagui'
import type {
  ProjectActivityKindViewModel,
  ProjectActivityRepoViewModel,
  ProjectActivityViewModel,
} from '../../../../features/systems/portfolio/projects/projects/projectsSelectors'
import Panel from '../../../shared/panel/panelView'

const Pill: React.FC<React.PropsWithChildren> = ({ children }) => (
  <XStack
    paddingHorizontal="$3"
    paddingVertical="$1"
    borderRadius="$10"
    borderWidth={1}
    borderColor="$borderColor"
    alignItems="center"
    gap="$2"
  >
    {children}
  </XStack>
)

const ActivityKind: React.FC<ProjectActivityKindViewModel> = ({ label, count }) => (
  <Pill>
    <Text fontFamily="$body" fontSize="$3">
      {label}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$2">
      {count}
    </Text>
  </Pill>
)

const renderKinds = ([
  item,
  ...rest
]: readonly ProjectActivityKindViewModel[]): React.ReactNode =>
  item ? (
    <>
      <ActivityKind {...item} />
      {renderKinds(rest)}
    </>
  ) : null

const ActivityRepo: React.FC<ProjectActivityRepoViewModel> = ({
  label,
  href,
  detail,
}) => (
  <XStack justifyContent="space-between" gap="$3" flexWrap="wrap">
    <Anchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      fontFamily="$body"
      fontSize="$3"
      flexShrink={1}
    >
      {label}
    </Anchor>
    <Text fontFamily="$body" fontSize="$3" opacity={0.8}>
      {detail}
    </Text>
  </XStack>
)

const renderRepos = ([
  item,
  ...rest
]: readonly ProjectActivityRepoViewModel[]): React.ReactNode =>
  item ? (
    <>
      <ActivityRepo {...item} />
      {renderRepos(rest)}
    </>
  ) : null

const ProjectActivity: React.FC<ProjectActivityViewModel> = ({
  meter,
  kinds,
  repos,
  summary,
}) => (
  <Panel label="Recent activity" meter={meter}>
    <YStack gap="$3">
      <XStack flexWrap="wrap" gap="$2">
        {renderKinds(kinds)}
      </XStack>
      <YStack gap="$2">{renderRepos(repos)}</YStack>
      {summary ? (
        <Text className="readout-label" fontFamily="$body" fontSize="$2">
          {summary}
        </Text>
      ) : null}
    </YStack>
  </Panel>
)

export default ProjectActivity
