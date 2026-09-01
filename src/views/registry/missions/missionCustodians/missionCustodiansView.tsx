import type React from 'react'
import { Anchor, Card, H3, Paragraph, Text, XStack, YStack } from 'tamagui'
import type {
  MissionOwnersViewProps,
  MissionOwnerViewModel,
  MissionRepoViewModel,
} from '../../../../features/systems/registry/missions/operations/operationsSelectors'
import Panel from '../../../aperture/panel/panelView'

const RepoCard: React.FC<MissionRepoViewModel> = ({
  name,
  htmlUrl,
  language,
  starsLabel,
  description,
  updatedLabel,
}) => (
  <Card
    className="system-glass-surface"
    padding="$4"
    elevate
    bordered
    backgroundColor="$surface"
  >
    <YStack gap="$2">
      <XStack
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap="$2"
        minWidth={0}
      >
        <Anchor
          href={htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          textDecorationLine="none"
          flexShrink={1}
          minWidth={0}
          minHeight={44}
          display="flex"
          justifyContent="center"
        >
          <H3 fontFamily="$heading" color="$color" minWidth={0}>
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
      {description ? <Paragraph fontFamily="$body">{description}</Paragraph> : null}
      <Text className="readout-label" fontFamily="$body" fontSize="$2">
        {updatedLabel}
      </Text>
    </YStack>
  </Card>
)

const renderRepos = (repos: readonly MissionRepoViewModel[]): React.ReactNode =>
  repos.map((repo) => <RepoCard key={repo.id} {...repo} />)

const OwnerSection: React.FC<MissionOwnerViewModel> = ({ label, meter, repos }) => (
  <Panel label={label} meter={meter}>
    <YStack gap="$3">{renderRepos(repos)}</YStack>
  </Panel>
)

const renderOwners = (owners: readonly MissionOwnerViewModel[]): React.ReactNode =>
  owners.map((owner) => <OwnerSection key={owner.id} {...owner} />)

const MissionOwners: React.FC<MissionOwnersViewProps> = ({ owners }) => (
  <>{renderOwners(owners)}</>
)

export default MissionOwners
