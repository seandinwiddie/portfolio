import type React from 'react'
import { Text, YStack } from 'tamagui'
import type { SignalTraceViewProps } from '../../../../features/systems/registry/dossier/ingress/ingressSelectors'

const SignalTrace: React.FC<SignalTraceViewProps> = ({
  visible,
  trace,
  accessibilityLabel,
  label,
}) =>
  visible ? (
    <YStack gap="$2" alignItems="center" maxWidth="100%">
      <Text
        className="signal-trace"
        fontFamily="$heading"
        color="$color"
        fontSize={13}
        $sm={{ fontSize: 8 }}
        selectable={false}
        accessibilityLabel={accessibilityLabel}
      >
        {trace}
      </Text>
      <Text className="readout-label" fontFamily="$body" fontSize="$2" letterSpacing={1}>
        {label}
      </Text>
    </YStack>
  ) : null

export default SignalTrace
