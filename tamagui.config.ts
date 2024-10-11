import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config/v2'

const tamaguiConfig = createTamagui(config)

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
