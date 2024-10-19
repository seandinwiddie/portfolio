import React from 'react';
import { YStack, Text } from 'tamagui';

const PortfolioFeatures: React.FC<{ features: any[] }> = ({ features }) => {
  return (
    <YStack space>
      {features.map((feature) => (
        <YStack key={feature.id} space="$2">
          <Text fontSize="$5" fontWeight="bold">{feature.title}</Text>
          <Text>{feature.description}</Text>
        </YStack>
      ))}
    </YStack>
  );
};

export default PortfolioFeatures;
