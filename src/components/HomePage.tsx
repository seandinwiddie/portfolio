import React from 'react';
import { YStack, Button, H1, Paragraph, Anchor, AnimatePresence } from 'tamagui';
import Screen from './Screen';
import PageHead from './PageHead';

const WEB_PRESENCES = [
  'https://seandinwiddie.com',
  'https://sdin.dev',
  'https://seandinwiddie.github.io',
] as const;

const labelOf = (url: string) => url.replace(/^https:\/\//, '');

const HomePage: React.FC = () => (
  <Screen center>
    <PageHead title="Home" description="Sean Dinwiddie's web presences and projects." />
    <AnimatePresence>
      <YStack gap="$4" maxWidth={600} alignSelf="center" animation="quick" enterStyle={{ opacity: 0, scale: 0.9 }}>
        <H1 ta="center" fontFamily="$heading" fontWeight="bold">Sean Dinwiddie's Portfolio</H1>
        <Paragraph ta="center" fontFamily="$body">
          Explore my various web presences and projects.
        </Paragraph>
      </YStack>
    </AnimatePresence>
    <YStack gap="$3" alignSelf="center">
      {WEB_PRESENCES.map((url) => (
        // Anchor renders a real <a href>: middle-clickable, focusable, and it
        // works on native where window.open does not exist.
        <Anchor key={url} href={url} target="_blank" rel="noopener noreferrer" textDecorationLine="none">
          <Button size="$5" animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
            {labelOf(url)}
          </Button>
        </Anchor>
      ))}
    </YStack>
  </Screen>
);

export default HomePage;
