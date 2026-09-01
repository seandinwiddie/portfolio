import type React from 'react'
import { Platform } from 'react-native'
import { ScrollView, YStack } from 'tamagui'
import type { ScreenViewProps } from '../../../features/systems/substrate/ui/presentation/screen/screenSelectors'

const nativeCanvasStyle =
  Platform.OS === 'web'
    ? undefined
    : ({
        width: '100%',
        maxWidth: 1680,
        paddingHorizontal: 16,
        gap: 16,
      } as const)

/**
 * Every screen's scroll container.
 *
 * +html.tsx renders <ScrollViewStyleReset />, which disables body scrolling on
 * web so ScrollView behaves like it does on native. Screens that laid their
 * content out in a bare flex YStack were therefore completely unscrollable on
 * phones -- anything past the fold was unreachable. One wrapper so no screen can
 * forget it again.
 */
const Screen: React.FC<ScreenViewProps> = ({ children, className, center = false }) => (
  <ScrollView
    className="system-screen"
    flex={1}
    contentContainerStyle={{
      flexGrow: 1,
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      justifyContent: center ? 'center' : 'flex-start',
      alignItems: 'stretch',
      // Web spacing belongs to the responsive system bridge. Native retains a
      // compact fallback without becoming a second web layout authority.
      paddingVertical: Platform.OS === 'web' ? 0 : 16,
    }}
    showsVerticalScrollIndicator
  >
    <YStack
      className={className ? `system-canvas ${className}` : 'system-canvas'}
      style={nativeCanvasStyle}
    >
      {children}
    </YStack>
  </ScrollView>
)

export default Screen
