import type React from 'react'
import { Text, YStack } from 'tamagui'
import type {
  ContentItemViewModel,
  PortfolioFeaturesViewProps,
} from '../../../../features/systems/portfolio/profile/content/contentSelectors'

const Feature: React.FC<ContentItemViewModel> = ({ title, description }) => (
  <YStack space="$2">
    <Text fontSize="$5" fontWeight="bold">
      {title}
    </Text>
    <Text>{description}</Text>
  </YStack>
)

const renderFeatures = ([
  feature,
  ...rest
]: readonly ContentItemViewModel[]): React.ReactNode =>
  feature ? (
    <>
      <Feature {...feature} />
      {renderFeatures(rest)}
    </>
  ) : null

const PortfolioFeatures: React.FC<PortfolioFeaturesViewProps> = ({ features }) => (
  <YStack space>{renderFeatures(features)}</YStack>
)

export default PortfolioFeatures
