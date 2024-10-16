import { useColorScheme } from 'react-native'
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { config } from '../../tamagui.config'
import { useAppSelector } from './hooks'
import { ToastProvider, ToastViewport } from '@tamagui/toast'

export function Provider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>) {
  const colorScheme = useColorScheme()
  const themeMode = useAppSelector((state) => state.themeToggle?.mode) || 'system'

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={themeMode === 'system' ? colorScheme : themeMode}
      {...rest}
    >
      <ToastProvider
        swipeDirection="horizontal"
        duration={6000}
        native={[]}
      >
        {children}
        <ToastViewport top="$8" left={0} right={0} />
      </ToastProvider>
    </TamaguiProvider>
  )
}
