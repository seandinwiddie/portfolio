import { Button, XStack } from 'tamagui'
import type { ThemeCustomViewProps } from '../../../../features/entities/shell/themes/themeCustom/themeCustomSelectors'

const controlStyle = {
  backgroundColor: '$controlBackground',
  borderColor: '$controlBorder',
  borderWidth: 1,
  color: '$controlForeground',
  flexBasis: 'auto',
  flexGrow: 1,
  hoverStyle: { backgroundColor: '$controlBackgroundHover' },
  focusStyle: { borderColor: '$focus', borderWidth: 2 },
} as const

const ThemeCustom = ({ loadLabel, onDownload, onLoad }: ThemeCustomViewProps) => (
  <XStack gap="$2" flexWrap="wrap" rowGap="$2">
    <Button {...controlStyle} onPress={onDownload}>
      Download Theme
    </Button>
    <Button {...controlStyle} onPress={onLoad}>
      {loadLabel}
    </Button>
  </XStack>
)

export default ThemeCustom
