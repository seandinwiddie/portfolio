import type React from 'react'
import { Text, YStack } from 'tamagui'
import type {
  RegistryRecordViewModel,
  RegistryCapabilitiesViewProps,
} from '../../../../features/systems/registry/dossier/records/recordsSelectors'

const Capability: React.FC<RegistryRecordViewModel> = ({ title, description }) => (
  <YStack space="$2">
    <Text fontSize="$5" fontWeight="bold">
      {title}
    </Text>
    <Text>{description}</Text>
  </YStack>
)

const renderCapabilities = (
  capabilities: readonly RegistryRecordViewModel[]
): React.ReactNode =>
  capabilities.map((capability) => <Capability key={capability.id} {...capability} />)

const RegistryCapabilities: React.FC<RegistryCapabilitiesViewProps> = ({
  capabilities,
}) => <YStack space>{renderCapabilities(capabilities)}</YStack>

export default RegistryCapabilities
