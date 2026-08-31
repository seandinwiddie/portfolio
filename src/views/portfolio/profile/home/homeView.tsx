import type React from 'react'
import { Anchor, H1, Paragraph, YStack } from 'tamagui'
import type {
  HomePresenceViewModel,
  HomeViewProps,
} from '../../../../features/systems/portfolio/profile/home/homeSelectors'
import Screen from '../../../shared/screen/screenView'

const PresenceLink: React.FC<HomePresenceViewModel> = ({ url, label }) => (
  <Anchor
    className="registry-link"
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    textDecorationLine="none"
    fontFamily="$body"
    fontSize="$5"
    paddingHorizontal="$5"
    paddingVertical="$3"
    borderWidth={1}
    borderColor="$controlBorder"
    backgroundColor="$surface"
    color="$link"
    hoverStyle={{ borderColor: '$focus', color: '$linkHover' }}
    focusStyle={{ borderColor: '$focus', borderWidth: 2 }}
    pressStyle={{ opacity: 0.72 }}
  >
    {label}
  </Anchor>
)

const renderPresences = ([
  presence,
  ...rest
]: readonly HomePresenceViewModel[]): React.ReactNode =>
  presence ? (
    <>
      <PresenceLink {...presence} />
      {renderPresences(rest)}
    </>
  ) : null

const HomePage: React.FC<HomeViewProps> = ({ presences }) => (
  <Screen center>
    <YStack className="ignite ignite-1" gap="$4" maxWidth={600} alignSelf="center">
      <H1 ta="center" fontFamily="$heading" fontWeight="bold">
        Sean Dinwiddie's Portfolio
      </H1>
      <Paragraph ta="center" fontFamily="$body">
        Explore my various web presences and projects.
      </Paragraph>
    </YStack>
    <YStack gap="$3" alignSelf="center">
      {renderPresences(presences)}
    </YStack>
  </Screen>
)

export default HomePage
