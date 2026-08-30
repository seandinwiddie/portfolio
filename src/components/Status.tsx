import React from 'react';
import { ScrollView, YStack, Text, Card, H2, Paragraph, AnimatePresence } from 'tamagui';
import { useAppSelector } from '../store/hooks';
import { selectBrandName, selectBrandNameLoading } from '../features/brandName/brandNameSlice';
import { selectDataSource } from '../features/body/bodySlice';
import {
  selectThemeMode,
  selectThemes,
  selectThemeStatus,
} from '../features/themeToggle/themeToggleSlice';

// "API Status" used to render the theme-fetch status, so it read "succeeded"
// even with the API unreachable. Route the real source through a table instead.
const API_STATUS_LABELS: Record<string, string> = {
  network: 'Connected — serving live data from api.sdin.dev',
  fallback: 'Unreachable — serving bundled fallback content',
  pending: 'Connecting…',
};

const Status: React.FC = () => {
  const brandName = useAppSelector(selectBrandName);
  const isBrandNameLoading = useAppSelector(selectBrandNameLoading);
  const dataSource = useAppSelector(selectDataSource);
  const themeStatus = useAppSelector(selectThemeStatus);
  const currentTheme = useAppSelector(selectThemeMode);
  const availableThemes = useAppSelector(selectThemes);

  if (isBrandNameLoading) {
    return <Text fontFamily="$body">Loading status...</Text>;
  }

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <AnimatePresence>
          <H2 key="application-status" animation="lazy" enterStyle={{ opacity: 0, y: -10 }} fontFamily="$heading">Application Status</H2>

          <Card key="api-status" padding="$4" elevate animation="lazy" enterStyle={{ opacity: 0, x: -10 }}>
            <H2 fontFamily="$heading">API Status</H2>
            <Paragraph fontFamily="$body">{API_STATUS_LABELS[dataSource] ?? dataSource}</Paragraph>
            <Paragraph fontFamily="$body">Brand Name: {brandName}</Paragraph>
          </Card>

          <Card key="theme-status" padding="$4" elevate animation="lazy" enterStyle={{ opacity: 0, x: -10 }}>
            <H2 fontFamily="$heading">Theme Status</H2>
            <Paragraph fontFamily="$body">Theme load status: {themeStatus}</Paragraph>
            <Paragraph fontFamily="$body">Current theme: {currentTheme}</Paragraph>
            <Paragraph fontFamily="$body">Available themes: {availableThemes.join(', ')}</Paragraph>
          </Card>
        </AnimatePresence>
      </YStack>
    </ScrollView>
  );
};

export default Status;
