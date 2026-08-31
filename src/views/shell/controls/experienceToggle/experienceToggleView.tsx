import type React from 'react'
import { Button, Text } from 'tamagui'
import type { ExperienceToggleViewProps } from '../../../../features/entities/shell/controls/experience/experienceSelectors'

const ExperienceToggle: React.FC<ExperienceToggleViewProps> = ({
  label,
  accessibilityLabel,
  onCycle,
}) => (
  <Button
    chromeless
    size="$3"
    onPress={onCycle}
    aria-label={accessibilityLabel}
    pressStyle={{ opacity: 0.72 }}
  >
    <Text fontFamily="$body" fontSize="$1" letterSpacing={1.5}>
      {label}
    </Text>
  </Button>
)

export default ExperienceToggle
