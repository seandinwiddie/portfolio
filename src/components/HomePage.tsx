import React from 'react';
import { YStack, Button, H1, Paragraph, Anchor, AnimatePresence } from 'tamagui';
import PageHead from './PageHead';

const WEB_PRESENCES = [
  'https://seandinwiddie.com',
  'https://sdin.dev',
  'https://seandinwiddie.github.io',
] as const;

const labelOf = (url: string) => url.replace(/^https:\/\//, '');

const HomePage: React.FC = () => {
  return (
    <YStack f={1} jc="center" ai="center" p="$4" space>
      <PageHead title="Home" description="Sean Dinwiddie's web presences and projects." />
      <AnimatePresence>
        <YStack space="$4" maw={600} animation="quick" enterStyle={{ opacity: 0, scale: 0.9 }} exitStyle={{ opacity: 0, scale: 0.9 }}>
          <H1 ta="center" fontFamily="$heading" fontWeight="bold">Sean Dinwiddie's Portfolio</H1>
          <Paragraph ta="center" fontFamily="$body">
            Explore my various web presences and projects.
          </Paragraph>
        </YStack>
      </AnimatePresence>
      <YStack space="$4" animation="lazy" enterStyle={{ opacity: 0, y: 10 }} exitStyle={{ opacity: 0, y: 10 }}>
        {WEB_PRESENCES.map((url) => (
          // Anchor renders a real <a href>, so these can be middle-clicked,
          // opened in a new tab, focused and copied. They were <button> elements
          // calling window.open, which allowed none of that -- and window.open
          // does not exist on native at all.
          <Anchor key={url} href={url} target="_blank" rel="noopener noreferrer" textDecorationLine="none">
            <Button size="$5" animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
              {labelOf(url)}
            </Button>
          </Anchor>
        ))}
      </YStack>
    </YStack>
  );
};

export default HomePage;
