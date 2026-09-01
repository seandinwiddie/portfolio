import type React from 'react'
import { Card, Text, YStack } from 'tamagui'
import type { TelemetryDeckViewProps } from '../../../../features/systems/registry/telemetry/diagnostics/diagnosticsSelectors'

const TelemetryDeck: React.FC<TelemetryDeckViewProps> = ({
  apiStatus,
  themeMode,
  brandName,
  heading,
  apiLabel,
  themeLabel,
  brandLabel,
}) => (
  <YStack f={1} padding="$4" space>
    <Text fontSize="$6" fontWeight="bold">
      {heading}
    </Text>
    <Card className="system-glass-surface" elevate bordered padding="$4">
      <Text>
        {apiLabel} {apiStatus}
      </Text>
      <Text>
        {themeLabel} {themeMode}
      </Text>
      <Text>
        {brandLabel} {brandName}
      </Text>
    </Card>
  </YStack>
)

export default TelemetryDeck
