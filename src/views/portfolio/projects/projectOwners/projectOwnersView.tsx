import type React from 'react'
import { Anchor, Card, H3, Paragraph, Text, XStack, YStack } from 'tamagui'
import type {
  ProjectOwnersViewProps,
  ProjectOwnerViewModel,
  ProjectRepoViewModel,
} from '../../../../features/systems/portfolio/projects/projects/projectsSelectors'
import Panel from '../../../shared/panel/panelView'

const RepoCard: React.FC<ProjectRepoViewModel> = ({
  name,
  htmlUrl,
  language,
  starsLabel,
  description,
  descriptionClassName,
  updatedLabel,
}) => (
  <Card padding="$4" elevate bordered backgroundColor="$surface">
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <Anchor
          href={htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          textDecorationLine="none"
          flexShrink={1}
        >
          <H3 fontFamily="$heading" color="$color">
            {name}
          </H3>
        </Anchor>
        <XStack gap="$3" alignItems="center" flexWrap="wrap">
          {language ? (
            <Text fontFamily="$body" fontSize="$2" opacity={0.8}>
              {language}
            </Text>
          ) : null}
          {starsLabel ? (
            <Text fontFamily="$body" fontSize="$2" opacity={0.8}>
              {starsLabel}
            </Text>
          ) : null}
        </XStack>
      </XStack>
      <Paragraph className={descriptionClassName} fontFamily="$body">
        {description}
      </Paragraph>
      <Text className="readout-label" fontFamily="$body" fontSize="$2">
        {updatedLabel}
      </Text>
    </YStack>
  </Card>
)

const renderRepos = ([
  repo,
  ...rest
]: readonly ProjectRepoViewModel[]): React.ReactNode =>
  repo ? (
    <>
      <RepoCard {...repo} />
      {renderRepos(rest)}
    </>
  ) : null

const OwnerSection: React.FC<ProjectOwnerViewModel> = ({ label, meter, repos }) => (
  <Panel label={label} meter={meter}>
    <YStack gap="$3">{renderRepos(repos)}</YStack>
  </Panel>
)

const renderOwners = ([
  owner,
  ...rest
]: readonly ProjectOwnerViewModel[]): React.ReactNode =>
  owner ? (
    <>
      <OwnerSection {...owner} />
      {renderOwners(rest)}
    </>
  ) : null

const ProjectOwners: React.FC<ProjectOwnersViewProps> = ({ owners }) => (
  <>{renderOwners(owners)}</>
)

export default ProjectOwners
