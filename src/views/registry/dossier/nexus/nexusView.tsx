import type React from 'react'
import { Anchor, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import type {
  NexusModuleViewProps,
  NexusPresenceViewModel,
} from '../../../../features/systems/registry/dossier/nexus/nexusSelectors'
import Screen from '../../../aperture/screen/screenView'

const PresenceLink: React.FC<NexusPresenceViewModel> = ({ url, label }) => (
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
    <Text className="registry-link-arrow" color="$accent" aria-hidden={true}>
      ↗
    </Text>
  </Anchor>
)

const renderPresences = (presences: readonly NexusPresenceViewModel[]): React.ReactNode =>
  presences.map((presence) => <PresenceLink key={presence.id} {...presence} />)

const NexusModule: React.FC<NexusModuleViewProps> = ({
  dataStatus,
  available,
  eyebrow,
  headline,
  statement,
  presenceLabel,
  presences,
  observatory,
}) => (
  <Screen center className="nexus-console">
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
        <YStack className="nexus-identity ignite ignite-1" gap="$4">
          <Text className="system-kicker" fontFamily="$body" fontSize="$1">
            {eyebrow}
          </Text>
          <H1 className="command-headline" fontFamily="$heading" fontWeight="bold">
            {headline}
          </H1>
          <Paragraph className="command-statement" fontFamily="$body">
            {statement}
          </Paragraph>
        </YStack>
        <YStack className="nexus-presence-deck panel-frame ignite ignite-2" gap="$3">
          <Text className="system-kicker" fontFamily="$body" fontSize="$1">
            {presenceLabel}
          </Text>
          {renderPresences(presences)}
        </YStack>
      </>
    ) : null}
    {observatory}
  </Screen>
)

export default NexusModule
