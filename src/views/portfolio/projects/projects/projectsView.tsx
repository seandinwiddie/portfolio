import type React from 'react'
import { Card, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import type {
  ProjectsDataViewModel,
  ProjectStatViewModel,
  ProjectsViewProps,
} from '../../../../features/systems/portfolio/projects/projects/projectsSelectors'
import Panel from '../../../shared/panel/panelView'
import Screen from '../../../shared/screen/screenView'
import ContributionGraph from '../contributionGraph/contributionGraphView'
import ProjectActivity from '../projectActivity/projectActivityView'
import ProjectArchive from '../projectArchive/projectArchiveView'
import ProjectLanguages from '../projectLanguages/projectLanguagesView'
import ProjectOwners from '../projectOwners/projectOwnersView'

const Stat: React.FC<ProjectStatViewModel> = ({ value, label }) => (
  <YStack minWidth={92}>
    <Text fontFamily="$heading" fontSize="$8" fontWeight="bold">
      {value}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$2">
      {label}
    </Text>
  </YStack>
)

const renderStats = ([
  stat,
  ...rest
]: readonly ProjectStatViewModel[]): React.ReactNode =>
  stat ? (
    <>
      <Stat {...stat} />
      {renderStats(rest)}
    </>
  ) : null

const ProjectsData: React.FC<ProjectsDataViewModel> = ({
  stats,
  contributionMeter,
  contributionGraph,
  commits,
  activity,
  languagesMeter,
  languages,
  owners,
}) => (
  <>
    <XStack gap="$5" flexWrap="wrap" rowGap="$3">
      {renderStats(stats)}
    </XStack>
    {contributionGraph && contributionMeter ? (
      <Panel label="Contribution calendar" meter={contributionMeter}>
        <ContributionGraph {...contributionGraph} />
      </Panel>
    ) : null}
    {commits ? <ProjectArchive {...commits} /> : null}
    <ProjectActivity {...activity} />
    <ProjectLanguages meter={languagesMeter} languages={languages} />
    <ProjectOwners owners={owners} />
  </>
)

const Projects: React.FC<ProjectsViewProps> = ({
  isLoading,
  isError,
  degradedMessage,
  data,
}) => (
  <Screen>
    <YStack gap="$2">
      <H1 fontFamily="$heading">Projects</H1>
      <Paragraph fontFamily="$body" opacity={0.8}>
        Pulled live from GitHub — this page updates itself whenever I push.
      </Paragraph>
    </YStack>
    {isLoading ? (
      <XStack gap="$2" alignItems="center">
        <Spinner />
        <Text fontFamily="$body">Loading projects…</Text>
      </XStack>
    ) : null}
    {isError ? (
      <Card padding="$4" bordered backgroundColor="$surface">
        <Paragraph fontFamily="$body">
          Couldn’t reach the projects service just now. The rest of the site still works.
        </Paragraph>
      </Card>
    ) : null}
    {degradedMessage ? (
      <Card padding="$4" bordered tag="output" backgroundColor="$surface">
        <Paragraph fontFamily="$body">{degradedMessage}</Paragraph>
      </Card>
    ) : null}
    {data ? <ProjectsData {...data} /> : null}
  </Screen>
)

export default Projects
