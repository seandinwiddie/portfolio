import React from 'react';
import { YStack, XStack, Text, Button, H1, Paragraph, AnimatePresence } from 'tamagui';
import { useRouter } from 'expo-router';

const Welcome: React.FC = () => {
  const router = useRouter();

  return (
    <YStack f={1} jc="center" ai="center" p="$4" space>
      <AnimatePresence>
        <YStack space="$4" maw={600} animation="quick" enterStyle={{ opacity: 0, scale: 0.9 }} exitStyle={{ opacity: 0, scale: 0.9 }}>
          <H1 ta="center" fontFamily="$heading" fontWeight="bold">Welcome to Sean's Portfolio</H1>
          <Paragraph ta="center" fontFamily="$body">
            Explore the world of Expo and RTK development through my projects and experiences.
          </Paragraph>
        </YStack>
      </AnimatePresence>
      <XStack space animation="lazy" enterStyle={{ opacity: 0, y: 10 }} exitStyle={{ opacity: 0, y: 10 }}>
        <Button size="$5" onPress={() => router.push('/about')} animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
          Explore Portfolio
        </Button>
        <Button size="$5" onPress={() => router.push('/status')} animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
          View Status
        </Button>
      </XStack>
    </YStack>
  );
};

export default Welcome;
