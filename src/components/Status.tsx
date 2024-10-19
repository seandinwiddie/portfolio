import React from 'react';
import { ScrollView, YStack, Text, Card } from 'tamagui';
import { useAppSelector } from '../app/hooks';

const Status: React.FC = () => {
  const apiStatus = useAppSelector((state) => state.api.status);
  const themeStatus = useAppSelector((state) => state.themeToggle.status);
  const currentTheme = useAppSelector((state) => state.themeToggle.mode);
  const availableThemes = useAppSelector((state) => state.themeToggle.themes);

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold">Application Status</Text>
        
        <Card padding="$4">
          <Text fontSize="$5" fontWeight="bold">API Status</Text>
          <Text fontSize="$4">{apiStatus}</Text>
        </Card>
        
        <Card padding="$4">
          <Text fontSize="$5" fontWeight="bold">Theme Status</Text>
          <Text fontSize="$4">Current status: {themeStatus}</Text>
          <Text fontSize="$4">Current theme: {currentTheme}</Text>
          <Text fontSize="$4">Available themes: {availableThemes.join(', ')}</Text>
        </Card>
        
        {/* Add more status information as needed */}
      </YStack>
    </ScrollView>
  );
};

export default Status;
