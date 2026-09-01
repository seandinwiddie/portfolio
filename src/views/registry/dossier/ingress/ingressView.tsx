import type React from 'react'
import { Anchor, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { Link } from 'expo-router'
import type {
  IngressCtaViewModel,
  IngressViewProps,
} from '../../../../features/systems/registry/dossier/ingress/ingressSelectors'
import Screen from '../../../aperture/screen/screenView'
import InstallQR from '../../telemetry/installQr/installQrView'
import SignalTrace from '../../telemetry/signalTrace/signalTraceView'
import UnitPlate from '../../telemetry/unitPlate/unitPlateView'

const renderCtas = (ctas: readonly IngressCtaViewModel[]): React.ReactNode =>
  ctas.map((cta) => (
    <Link key={cta.href} href={cta.href} push asChild>
      <Anchor
        className="registry-link ingress-action-link"
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={48}
        paddingHorizontal="$4"
        paddingVertical="$3"
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$3"
        pressStyle={{ opacity: 0.72 }}
        hoverStyle={{ borderColor: '$accent' }}
        fontFamily="$body"
        textDecorationLine="none"
      >
        {cta.label}
      </Anchor>
    </Link>
  ))

const Ingress: React.FC<IngressViewProps> = ({
  dataStatus,
  available,
  eyebrow,
  identityLabel,
  name,
  statement,
  accessLabel,
  accessCountLabel,
  ctas,
  signalTrace,
  unitPlate,
  installQr,
}) => (
  <Screen center className="ingress-console">
    {dataStatus.pendingLabel ? (
      <XStack gap="$2" alignItems="center">
        <Spinner />
        <Text fontFamily="$body">{dataStatus.pendingLabel}</Text>
      </XStack>
    ) : null}
    {dataStatus.errorLabel ? (
      <Text role="alert" fontFamily="$body">
        {dataStatus.errorLabel}
      </Text>
    ) : null}
    {dataStatus.staleLabel ? (
      <Text accessibilityLiveRegion="polite" fontFamily="$body">
        {dataStatus.staleLabel}
      </Text>
    ) : null}
    {available ? (
      <>
        <YStack className="ingress-signal ignite ignite-1 drift" maxWidth="100%">
          <Text className="system-kicker" fontFamily="$body" fontSize="$1">
            {eyebrow}
          </Text>
          <SignalTrace {...signalTrace} />
        </YStack>

        <YStack className="ingress-identity ignite ignite-2" gap="$4">
          <Text
            className="readout-label system-section-code"
            fontFamily="$body"
            fontSize="$1"
          >
            {identityLabel}
          </Text>
          <H1 className="command-headline" fontFamily="$heading" fontWeight="bold">
            {name}
          </H1>
          <YStack
            className="rule"
            height={1}
            backgroundColor="$borderColor"
            width="60%"
          />
          <Paragraph className="command-statement" fontFamily="$body" opacity={0.88}>
            {statement}
          </Paragraph>
        </YStack>

        <YStack className="ingress-access panel-frame ignite ignite-3" gap="$4">
          <XStack justifyContent="space-between" gap="$3" alignItems="center">
            <Text className="system-kicker" fontFamily="$body" fontSize="$1">
              {accessLabel}
            </Text>
            <Text className="readout-label" fontFamily="$body" fontSize="$1">
              {ctas.length.toString().padStart(2, '0')} {accessCountLabel}
            </Text>
          </XStack>
          <XStack className="ingress-actions" gap="$3" flexWrap="wrap">
            {renderCtas(ctas)}
          </XStack>
        </YStack>

        <YStack className="ingress-plate ignite ignite-4" minWidth={0}>
          <UnitPlate {...unitPlate} />
        </YStack>
        <YStack className="ingress-qr ignite ignite-4" minWidth={0}>
          <InstallQR {...installQr} />
        </YStack>
      </>
    ) : null}
  </Screen>
)

export default Ingress
