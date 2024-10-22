import React from 'react';
import { ScrollView, YStack, Text, Card, H2, Paragraph } from 'tamagui';
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
        <H2>Application Status</H2>
        
        <Card padding="$4" elevate>
          <H2>API Status</H2>
          {isBrandNameLoading && <Paragraph>Loading...</Paragraph>}
          {!isBrandNameLoading && (
            <Paragraph>Brand Name: {brandName}</Paragraph>
          )}
        </Card>
        
        <Card padding="$4" elevate>
          <H2>Theme Status</H2>
          <Paragraph>Current status: {themeStatus}</Paragraph>
          <Paragraph>Current theme: {currentTheme}</Paragraph>
          <Paragraph>Available themes: {availableThemes.join(', ')}</Paragraph>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default Status;
