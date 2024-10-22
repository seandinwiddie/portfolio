import React from 'react';
import { XStack, Anchor, Paragraph } from 'tamagui';

const Footer: React.FC = () => {
  return (
    <XStack
      backgroundColor="$background"
      borderTopColor="$borderColor"
      borderTopWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
      alignItems="center"
      justifyContent="space-between"
      animation="lazy"
      enterStyle={{ opacity: 0, y: 10 }}
      exitStyle={{ opacity: 0, y: 10 }}
    >
      <Anchor href="https://github.com/seandinwiddie/portfolio" target="_blank" rel="noopener noreferrer">
        <Paragraph fontFamily="$body">Portfolio Repo</Paragraph>
      </Anchor>
      <Anchor href="https://github.com/seandinwiddie/api.sdin.dev" target="_blank" rel="noopener noreferrer">
        <Paragraph fontFamily="$body">API Repo</Paragraph>
      </Anchor>
    </XStack>
  );
};

export default Footer;
