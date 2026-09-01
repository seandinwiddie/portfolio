import type React from 'react'
import { Text, XStack } from 'tamagui'
import type {
  MissionLanguagesViewProps,
  MissionLanguageViewModel,
} from '../../../../features/systems/registry/missions/operations/operationsSelectors'
import Panel from '../../../aperture/panel/panelView'

const Language: React.FC<MissionLanguageViewModel> = ({ language, detail }) => (
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

const renderLanguages = (
  languages: readonly MissionLanguageViewModel[]
): React.ReactNode =>
  languages.map((language) => <Language key={language.id} {...language} />)

const MissionLanguages: React.FC<MissionLanguagesViewProps> = ({
  label,
  meter,
  languages,
}) => (
  <Panel label={label} meter={meter}>
    <XStack flexWrap="wrap" gap="$2">
      {renderLanguages(languages)}
    </XStack>
  </Panel>
)

export default MissionLanguages
