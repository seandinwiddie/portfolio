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
              <Text fontSize="$5" fontWeight="bold" marginTop="$2">Portfolio Features:</Text>
              {portfolioFeatures.map((feature) => (
                <Card key={feature.id} padding="$2" marginTop="$1">
                  <Text fontSize="$4" fontWeight="bold">{feature.title}</Text>
                  <Text fontSize="$3">{feature.description}</Text>
                </Card>
              ))}
              <Text fontSize="$5" fontWeight="bold" marginTop="$2">App Procedures:</Text>
              {appProcedures.map((procedure) => (
                <Card key={procedure.id} padding="$2" marginTop="$1">
                  <Text fontSize="$4" fontWeight="bold">{procedure.title}</Text>
                  <Text fontSize="$3">{procedure.description}</Text>
                </Card>
              ))}
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
