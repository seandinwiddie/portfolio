import React from 'react';
import { YStack, XStack, Button, H1, Paragraph, AnimatePresence } from 'tamagui';
import { useRouter } from 'expo-router';
import Screen from './Screen';
import InstallQR from './InstallQR';
import SignalTrace from './SignalTrace';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';

const CTAS = [
  { href: '/about', label: 'Explore Portfolio' },
  { href: '/projects', label: 'Live Projects' },
  { href: '/status', label: 'View Status' },
] as const;

const Welcome: React.FC = () => {
  const router = useRouter();
  // Shares RTK Query's cache with /projects, so this costs no extra request.
  const { data } = useGetGithubSummaryQuery();

  return (
    <Screen center>
      {/* The signature: a year of real work as an instrument readout. It is
          absent until the data arrives rather than reserving a hole. */}
      {data?.contributions ? (
        <SignalTrace days={data.contributions.days} total={data.contributions.total} />
      ) : null}

      <AnimatePresence>
        <YStack gap="$4" maxWidth={600} alignSelf="center" animation="quick" enterStyle={{ opacity: 0, scale: 0.9 }}>
          <H1 ta="center" fontFamily="$heading" fontWeight="bold">Welcome to Sean's Portfolio</H1>
          <Paragraph ta="center" fontFamily="$body">
            Explore the world of Expo and RTK development through my projects and experiences.
          </Paragraph>
        </YStack>
      </AnimatePresence>

      {/* flexWrap: three buttons in a row overflowed a 375px viewport, pushing
          the page sideways with no way to reach the last one. */}
      <XStack gap="$3" flexWrap="wrap" justifyContent="center" alignSelf="center">
        {CTAS.map(({ href, label }) => (
          <Button
            key={href}
            size="$5"
            onPress={() => router.push(href)}
            animation="quick"
            pressStyle={{ scale: 0.95 }}
            fontFamily="$body"
          >
            {label}
          </Button>
        ))}
      </XStack>

      <YStack alignSelf="center">
        <InstallQR />
      </YStack>
    </Screen>
  );
};

export default Welcome;
