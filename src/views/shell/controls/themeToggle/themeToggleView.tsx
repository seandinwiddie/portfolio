import { Button } from 'tamagui'
import type { ThemeToggleViewProps } from '../../../../features/entities/shell/themes/themeSelection/themeSelectionSelectors'

const ThemeToggle = ({ label, onCycle }: ThemeToggleViewProps) => (
  <Button
    testID="theme-toggle"
    onPress={onCycle}
    backgroundColor="$controlBackground"
    borderColor="$controlBorder"
    borderWidth={1}
    color="$controlForeground"
    hoverStyle={{ backgroundColor: '$controlBackgroundHover' }}
    focusStyle={{ borderColor: '$focus', borderWidth: 2 }}
  >
    Theme: {label}
  </Button>
)

export default ThemeToggle
