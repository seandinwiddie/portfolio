import React from 'react';
import { YStack, Button, H1, Paragraph, AnimatePresence } from 'tamagui';

const HomePage: React.FC = () => {
  return (
    <YStack f={1} jc="center" ai="center" p="$4" space>
      <AnimatePresence>
        <YStack space="$4" maw={600} animation="quick" enterStyle={{ opacity: 0, scale: 0.9 }} exitStyle={{ opacity: 0, scale: 0.9 }}>
          <H1 ta="center" fontFamily="$heading" fontWeight="bold">Sean Dinwiddie's Portfolio</H1>
          <Paragraph ta="center" fontFamily="$body">
            Explore my various web presences and projects.
          </Paragraph>
        </YStack>
      </AnimatePresence>
      <YStack space="$4" animation="lazy" enterStyle={{ opacity: 0, y: 10 }} exitStyle={{ opacity: 0, y: 10 }}>
        <Button 
          size="$5" 
          onPress={() => window.open('https://seandinwiddie.com', '_blank')} 
          animation="quick" 
          pressStyle={{ scale: 0.95 }} 
          fontFamily="$body"
        >
          seandinwiddie.com
        </Button>
        <Button 
          size="$5" 
          onPress={() => window.open('https://sdin.dev', '_blank')} 
          animation="quick" 
          pressStyle={{ scale: 0.95 }} 
          fontFamily="$body"
        >
          sdin.dev
        </Button>
        <Button 
          size="$5" 
          onPress={() => window.open('https://seandinwiddie.github.io', '_blank')} 
          animation="quick" 
          pressStyle={{ scale: 0.95 }} 
          fontFamily="$body"
        >
          seandinwiddie.github.io
        </Button>
      </YStack>
    </YStack>
  );
};

export default HomePage;
