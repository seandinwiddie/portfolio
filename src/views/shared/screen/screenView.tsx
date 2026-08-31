import type React from 'react'
import { ScrollView, YStack } from 'tamagui'
import type { ScreenViewProps } from '../../../features/systems/platform/ui/presentation/screen/screenSelectors'

/**
 * Every screen's scroll container.
 *
 * +html.tsx renders <ScrollViewStyleReset />, which disables body scrolling on
 * web so ScrollView behaves like it does on native. Screens that laid their
 * content out in a bare flex YStack were therefore completely unscrollable on
 * phones -- anything past the fold was unreachable. One wrapper so no screen can
 * forget it again.
 */
const Screen: React.FC<ScreenViewProps> = ({ children, center = false }) => (
  <ScrollView
    flex={1}
    contentContainerStyle={{
      flexGrow: 1,
      justifyContent: center ? 'center' : 'flex-start',
      alignItems: 'center',
      paddingVertical: 16,
      // Clears the global command-deck trigger without sacrificing phone scroll.
      paddingBottom: 80,
    }}
    showsVerticalScrollIndicator
  >
    <YStack width="100%" maxWidth={900} paddingHorizontal="$4" gap="$4">
      {children}
    </YStack>
  </ScrollView>
)

export default Screen
