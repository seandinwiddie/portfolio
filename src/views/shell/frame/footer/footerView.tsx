import type React from 'react'
import { XStack, Anchor, Paragraph } from 'tamagui'

const Footer: React.FC = () => {
  return (
    <XStack
      backgroundColor="$surface"
      borderTopColor="$borderColor"
      borderTopWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      flexWrap="wrap"
      tag="footer"
    >
      <Anchor
        href="https://github.com/seandinwiddie/portfolio"
        target="_blank"
        rel="noopener noreferrer"
        color="$link"
        hoverStyle={{ color: '$linkHover' }}
      >
        <Paragraph fontFamily="$body">Portfolio Repo</Paragraph>
      </Anchor>
      <Anchor
        href="https://github.com/seandinwiddie/api.sdin.dev"
        target="_blank"
        rel="noopener noreferrer"
        color="$link"
        hoverStyle={{ color: '$linkHover' }}
      >
        <Paragraph fontFamily="$body">API Repo</Paragraph>
      </Anchor>
    </XStack>
  )
}

export default Footer
