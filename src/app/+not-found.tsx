import React from 'react';
import PageHead from '../components/PageHead';
import { YStack, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';

export default function NotFound() {
  const router = useRouter();

  return (
    <YStack f={1} jc="center" ai="center" p="$4" space>
      <PageHead title="Page not found" description="This page does not exist." />
      <Text fontSize="$6" fontWeight="bold">Oops!</Text>
      <Text>This screen doesn't exist.</Text>
      <Button onPress={() => router.replace('/')}>Go to home screen!</Button>
    </YStack>
  );
}
