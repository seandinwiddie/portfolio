import type React from 'react'
import { YStack, XStack, Text, H2 } from 'tamagui'
import type { PanelViewProps } from '../../../features/systems/platform/ui/presentation/panel/panelSelectors'

/**
 * A bracketed readout panel.
 *
 * The corner brackets and the all-caps eyebrow are the instrument vernacular
 * the repos already use (ASCII frames, [VOID::WATCHER], runic markers). The
 * eyebrow is structural rather than decorative: it names what the panel is a
 * readout OF, and the optional `meter` carries that panel's own count.
 */
const Panel: React.FC<PanelViewProps> = ({ label, meter, children }) => (
  <YStack
    // Web-only: corner brackets have no React Native equivalent.
    className="panel-frame"
    borderWidth={1}
    borderColor="$borderColor"
    padding="$4"
    gap="$3"
    backgroundColor="$surface"
  >
    <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
      <H2
        fontFamily="$body"
        fontSize="$2"
        lineHeight="$2"
        letterSpacing={3}
        textTransform="uppercase"
      >
        {label}
      </H2>
      {meter !== undefined ? (
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$2"
          letterSpacing={2}
        >
          {meter}
        </Text>
      ) : null}
    </XStack>
    {children}
  </YStack>
)

export default Panel
