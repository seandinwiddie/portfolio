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
    >
      <Anchor href="https://github.com/seandinwiddie/portfolio" target="_blank" rel="noopener noreferrer">
        <Paragraph>Portfolio Repo</Paragraph>
      </Anchor>
      <Anchor href="https://github.com/seandinwiddie/api.sdin.dev" target="_blank" rel="noopener noreferrer">
        <Paragraph>API Repo</Paragraph>
      </Anchor>
    </XStack>
  );
};

export default Footer;
