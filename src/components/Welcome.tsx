import React from 'react';
import { YStack, XStack, Button, H1, Paragraph } from 'tamagui';
import { useRouter } from 'expo-router';
import Screen from './Screen';
import InstallQR from './InstallQR';
import SignalTrace from './SignalTrace';
import UnitPlate from './UnitPlate';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';

const CTAS = [
  { href: '/projects', label: 'Live Projects' },
  { href: '/about', label: 'Explore Portfolio' },
  { href: '/status', label: 'View Status' },
] as const;

const Welcome: React.FC = () => {
  const router = useRouter();
  // Shares RTK Query's cache with /projects, so this costs no extra request.
  const { data } = useGetGithubSummaryQuery();

  return (
    <Screen center>
      {/* One orchestrated ignition: the trace comes online, then the title,
          then the controls, then the QR. Each stage carries its own delay
          rather than every element animating independently. */}
      {data?.contributions ? (
        <YStack className="ignite ignite-1 drift" alignSelf="center" maxWidth="100%">
          <SignalTrace days={data.contributions.days} total={data.contributions.total} />
        </YStack>
      ) : null}

      <YStack className="ignite ignite-2" gap="$4" maxWidth={620} alignSelf="center">
        <H1 ta="center" fontFamily="$heading" fontWeight="bold" letterSpacing={-0.5}>
          Sean Dinwiddie
        </H1>
        <YStack className="rule" height={1} backgroundColor="$borderColor" alignSelf="center" width="60%" />
        <Paragraph ta="center" fontFamily="$body" opacity={0.85}>
          AI systems architect and full-stack engineer. Local-first neuro-symbolic
          engines, universal Expo apps, and functional cores in TypeScript, C++ and Haskell.
        </Paragraph>
      </YStack>

      <XStack className="ignite ignite-3" gap="$3" flexWrap="wrap" justifyContent="center" alignSelf="center">
        {CTAS.map(({ href, label }) => (
          <Button
            key={href}
            size="$5"
            onPress={() => router.push(href)}
            animation="stately"
            pressStyle={{ scale: 0.96 }}
            hoverStyle={{ borderColor: '$accent' }}
            fontFamily="$body"
          >
            {label}
          </Button>
        ))}
      </XStack>

      {data ? (
        <YStack className="ignite ignite-4" alignSelf="center" width="100%" alignItems="center">
          <UnitPlate data={data} />
        </YStack>
      ) : null}

      <YStack className="ignite ignite-4" alignSelf="center">
        <InstallQR />
      </YStack>
    </Screen>
  );
};

export default Welcome;
