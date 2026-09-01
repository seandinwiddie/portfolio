import { Button, Text, XStack, YStack } from 'tamagui'
import type { ThemeCustomViewProps } from '../../../../features/entities/bridge/spectrum/themeCustom/themeCustomSelectors'

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

const ThemeCustom = ({
  loadLabel,
  downloadLabel,
  feedback,
  onDownload,
  onLoad,
}: ThemeCustomViewProps) => (
  <YStack gap="$1">
    <XStack gap="$2" flexWrap="wrap" rowGap="$2">
      <Button {...controlStyle} testID="theme-download" onPress={onDownload}>
        {downloadLabel}
      </Button>
      <Button {...controlStyle} testID="theme-custom-load" onPress={onLoad}>
        {loadLabel}
      </Button>
    </XStack>
    {feedback ? (
      <Text
        className={feedback.className}
        role={feedback.role}
        aria-live={feedback.live}
        fontFamily="$body"
        fontSize="$1"
      >
        {feedback.text}
      </Text>
    ) : null}
  </YStack>
)

export default ThemeCustom
