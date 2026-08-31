import type React from 'react'
import { Text, XStack } from 'tamagui'
import type {
  ProjectLanguagesViewProps,
  ProjectLanguageViewModel,
} from '../../../../features/systems/portfolio/projects/projects/projectsSelectors'
import Panel from '../../../shared/panel/panelView'

const Language: React.FC<ProjectLanguageViewModel> = ({ language, detail }) => (
  <XStack
    paddingHorizontal="$3"
    paddingVertical="$1"
    borderRadius="$10"
    borderWidth={1}
    borderColor="$borderColor"
    alignItems="center"
    gap="$2"
  >
    <Text fontFamily="$body" fontSize="$3">
      {language}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$2">
      {detail}
    </Text>
  </XStack>
)

const renderLanguages = ([
  language,
  ...rest
]: readonly ProjectLanguageViewModel[]): React.ReactNode =>
  language ? (
    <>
      <Language {...language} />
      {renderLanguages(rest)}
    </>
  ) : null

const ProjectLanguages: React.FC<ProjectLanguagesViewProps> = ({ meter, languages }) => (
  <Panel label="Languages" meter={meter}>
    <XStack flexWrap="wrap" gap="$2">
      {renderLanguages(languages)}
    </XStack>
  </Panel>
)

export default ProjectLanguages
