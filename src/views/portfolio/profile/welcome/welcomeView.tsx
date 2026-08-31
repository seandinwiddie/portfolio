import type React from 'react'
import { Button, H1, Paragraph, XStack, YStack } from 'tamagui'
import type {
  WelcomeCtaViewModel,
  WelcomeViewProps,
} from '../../../../features/systems/portfolio/profile/welcome/welcomeSelectors'
import Screen from '../../../shared/screen/screenView'
import InstallQR from '../../diagnostics/installQr/installQrView'
import SignalTrace from '../../diagnostics/signalTrace/signalTraceView'
import UnitPlate from '../../diagnostics/unitPlate/unitPlateView'

const renderCtas = (
  [cta, ...rest]: readonly WelcomeCtaViewModel[],
  onNavigate: WelcomeViewProps['onNavigate']
): React.ReactNode =>
  cta ? (
    <>
      <Button
        size="$5"
        onPress={() => onNavigate(cta.href)}
        pressStyle={{ opacity: 0.72 }}
        hoverStyle={{ borderColor: '$accent' }}
        fontFamily="$body"
      >
        {cta.label}
      </Button>
      {renderCtas(rest, onNavigate)}
    </>
  ) : null

const Welcome: React.FC<WelcomeViewProps> = ({
  ctas,
  signalTrace,
  unitPlate,
  installQr,
  onNavigate,
}) => (
  <Screen center>
    <YStack className="ignite ignite-1 drift" alignSelf="center" maxWidth="100%">
      <SignalTrace {...signalTrace} />
    </YStack>
    <YStack className="ignite ignite-2" gap="$4" maxWidth={620} alignSelf="center">
      <H1 ta="center" fontFamily="$heading" fontWeight="bold" letterSpacing={-0.5}>
        Sean Dinwiddie
      </H1>
      <YStack
        className="rule"
        height={1}
        backgroundColor="$borderColor"
        alignSelf="center"
        width="60%"
      />
      <Paragraph ta="center" fontFamily="$body" opacity={0.85}>
        AI systems architect and full-stack engineer. Local-first neuro-symbolic engines,
        universal Expo apps, and functional cores in TypeScript, C++ and Haskell.
      </Paragraph>
    </YStack>
    <XStack
      className="ignite ignite-3"
      gap="$3"
      flexWrap="wrap"
      justifyContent="center"
      alignSelf="center"
    >
      {renderCtas(ctas, onNavigate)}
    </XStack>
    <YStack
      className="ignite ignite-4"
      alignSelf="center"
      width="100%"
      alignItems="center"
    >
      <UnitPlate {...unitPlate} />
    </YStack>
    <YStack className="ignite ignite-4" alignSelf="center">
      <InstallQR {...installQr} />
    </YStack>
  </Screen>
)

export default Welcome
