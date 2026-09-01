import { Button } from 'tamagui'
import type { SoundPreferenceViewProps } from '../../../../features/entities/bridge/console/soundPreference/soundPreferenceSelectors'

const SoundPreference = ({
  enabled,
  ready,
  text,
  label,
  onToggle,
}: SoundPreferenceViewProps) =>
  ready ? (
    <Button
      testID="sound-preference-toggle"
      className="system-sound-preference"
      onPress={onToggle}
      aria-label={label}
      aria-pressed={enabled}
      backgroundColor="$controlBackground"
      borderColor="$controlBorder"
      borderWidth={1}
      color="$controlForeground"
      hoverStyle={{ backgroundColor: '$controlBackgroundHover' }}
      focusStyle={{ borderColor: '$focus', borderWidth: 2 }}
    >
      {text}
    </Button>
  ) : null

export default SoundPreference
