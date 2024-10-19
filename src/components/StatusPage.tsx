import React from 'react';
import { YStack, Text, Card } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';

const StatusPage: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const themeMode = useAppSelector((state) => state.themeToggle.mode);
  const brandName = useAppSelector((state) => state.nav.brandName);

  return (
    <YStack f={1} padding="$4" space>
      <Text fontSize="$6" fontWeight="bold">Application Status</Text>
      <Card elevate bordered padding="$4">
        <Text>API Status: {isLoading ? 'Loading' : error ? 'Error' : 'Connected'}</Text>
        <Text>Current Theme: {themeMode}</Text>
        <Text>Brand Name: {brandName}</Text>
      </Card>
    </YStack>
  );
};

export default StatusPage;

