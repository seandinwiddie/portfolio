import React from 'react';
import { YStack, Text, Card } from 'tamagui';
import { useGetInitialStateQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../store/hooks';
import { selectThemeMode } from '../features/themeToggle/themeToggleSlice';
import { selectNavBrandName } from '../features/nav/navSlice';

const StatusPage: React.FC = () => {
  const { isLoading, error } = useGetInitialStateQuery();
  const themeMode = useAppSelector(selectThemeMode);
  const brandName = useAppSelector(selectNavBrandName);

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

