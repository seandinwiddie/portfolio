import React from 'react';
import { ScrollView, YStack, Text, Card, H2, Paragraph, AnimatePresence } from 'tamagui';
import { useAppSelector } from '../store/hooks';
import { selectBrandName, selectBrandNameLoading } from '../features/brandName/brandNameSlice';
import {
  selectThemeMode,
  selectThemes,
  selectThemeStatus,
} from '../features/themeToggle/themeToggleSlice';

const Status: React.FC = () => {
  const brandName = useAppSelector(selectBrandName);
  const isBrandNameLoading = useAppSelector(selectBrandNameLoading);
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
            <Paragraph fontFamily="$body">Brand Name: {brandName}</Paragraph>
          </Card>

          <Card key="theme-status" padding="$4" elevate animation="lazy" enterStyle={{ opacity: 0, x: -10 }}>
            <H2 fontFamily="$heading">Theme Status</H2>
            <Paragraph fontFamily="$body">Current status: {themeStatus}</Paragraph>
            <Paragraph fontFamily="$body">Current theme: {currentTheme}</Paragraph>
            <Paragraph fontFamily="$body">Available themes: {availableThemes.join(', ')}</Paragraph>
          </Card>
        </AnimatePresence>
      </YStack>
    </ScrollView>
  );
};

export default Status;
