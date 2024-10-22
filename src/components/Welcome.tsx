import React from 'react';
import { YStack, XStack, Text, Button, H1, Paragraph } from 'tamagui';
import { useRouter } from 'expo-router';

const Welcome: React.FC = () => {
  const router = useRouter();

  return (
    <YStack f={1} jc="center" ai="center" p="$4" space>
      <YStack space="$4" maw={600}>
        <H1 ta="center" fow="800">Welcome to Sean's Portfolio</H1>
        <Paragraph ta="center" theme="alt2">
          Explore the world of Expo Go and RTK development through my projects and experiences.
        </Paragraph>
      </YStack>
      <XStack space>
        <Button theme="active" size="$5" onPress={() => router.push('/home')}>
          Explore Portfolio
        </Button>
        <Button theme="alt2" size="$5" onPress={() => router.push('/status')}>
          View Status
        </Button>
      </XStack>
    </YStack>
  );
};

export default Welcome;
