import React from 'react';
import { ScrollView, YStack, Text, Card } from 'tamagui';
import { useAppSelector } from '../app/hooks';

const Status: React.FC = () => {
  const { portfolioFeatures, appProcedures } = useAppSelector((state) => state.body);
  const { value: brandName, isLoading: isBrandNameLoading } = useAppSelector((state) => state.brandName);
  const { status: themeStatus, mode: currentTheme, themes: availableThemes } = useAppSelector((state) => state.themeToggle);

  if (isBrandNameLoading) {
    return <Text>Loading status...</Text>;
  }

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold">Application Status</Text>
        
        <Card padding="$4">
          <Text fontSize="$5" fontWeight="bold">API Status</Text>
          {isBrandNameLoading && <Text fontSize="$4">Loading...</Text>}
          {!isBrandNameLoading && (
            <>
              <Text fontSize="$4">Brand Name: {brandName}</Text>
            </>
          )}
        </Card>
        
        <Card padding="$4">
          <Text fontSize="$5" fontWeight="bold">Theme Status</Text>
          <Text fontSize="$4">Current status: {themeStatus}</Text>
          <Text fontSize="$4">Current theme: {currentTheme}</Text>
          <Text fontSize="$4">Available themes: {availableThemes.join(', ')}</Text>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default Status;
