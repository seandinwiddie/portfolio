import type React from 'react'
import { Card, Text, YStack } from 'tamagui'
import type { LegacyStatusViewProps } from '../../../../features/systems/portfolio/diagnostics/status/statusSelectors'

const StatusPage: React.FC<LegacyStatusViewProps> = ({
  apiStatus,
  themeMode,
  brandName,
}) => (
  <YStack f={1} padding="$4" space>
    <Text fontSize="$6" fontWeight="bold">
      Application Status
    </Text>
    <Card elevate bordered padding="$4">
      <Text>API Status: {apiStatus}</Text>
      <Text>Current Theme: {themeMode}</Text>
      <Text>Brand Name: {brandName}</Text>
    </Card>
  </YStack>
)

export default StatusPage
