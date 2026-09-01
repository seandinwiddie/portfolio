import type React from 'react'
import { Link } from 'expo-router'
import { Anchor, H1, Spinner, Text, XStack, YStack } from 'tamagui'
import type { LostSignalViewProps } from '../../../../features/systems/registry/wayfinding/lostSignal/lostSignalSelectors'
import Screen from '../../../aperture/screen/screenView'

const LostSignal: React.FC<LostSignalViewProps> = ({
  dataStatus,
  eyebrow,
  headline,
  statement,
  actionLabel,
  actionHref,
}) => (
  <Screen center className="lost-signal-console">
    <YStack jc="center" ai="center" p="$4" space>
      {dataStatus.pendingLabel ? (
        <XStack gap="$2" alignItems="center">
          <Spinner />
          <Text>{dataStatus.pendingLabel}</Text>
        </XStack>
      ) : null}
      {dataStatus.errorLabel ? <Text role="alert">{dataStatus.errorLabel}</Text> : null}
      {dataStatus.staleLabel ? (
        <Text accessibilityLiveRegion="polite">{dataStatus.staleLabel}</Text>
      ) : null}
      <Text className="readout-label" fontFamily="$body" letterSpacing={3}>
        {eyebrow}
      </Text>
      <H1 fontSize="$8" fontWeight="bold">
        {headline}
      </H1>
      <Text>{statement}</Text>
      <Link href={actionHref} push asChild>
        <Anchor
          className="registry-link lost-signal-action"
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight={44}
          paddingHorizontal="$4"
          paddingVertical="$3"
          backgroundColor="$surface"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          textDecorationLine="none"
        >
          {actionLabel}
        </Anchor>
      </Link>
    </YStack>
  </Screen>
)

export default LostSignal
