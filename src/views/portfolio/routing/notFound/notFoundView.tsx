import type React from 'react'
import { Button, H1, Text, YStack } from 'tamagui'
import type { NotFoundViewProps } from '../../../../features/systems/portfolio/routing/notFound/notFoundSelectors'

const NotFound: React.FC<NotFoundViewProps> = ({ onReturn }) => (
  <YStack f={1} jc="center" ai="center" p="$4" space>
    <Text className="readout-label" fontFamily="$body" letterSpacing={3}>
      NAVIGATION VOID
    </Text>
    <H1 fontSize="$8" fontWeight="bold">
      Page not found.
    </H1>
    <Text>This coordinate is outside the registry.</Text>
    <Button onPress={onReturn}>Return to the registry</Button>
  </YStack>
)

export default NotFound
