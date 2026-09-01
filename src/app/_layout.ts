import { SplashScreen } from 'expo-router'
import '../styles/fonts.css'
import '../styles/body.css'
import '../styles/app.css'
import '../styles/signal.css'
import '../styles/system.css'
import '../styles/themes/theme-light.css'
import '../styles/themes/theme-dark.css'
import '../styles/themes/theme-dracula.css'
import '../styles/themes/theme-neon.css'
import '../styles/themes/theme-mirage.css'
import '../styles/themes/theme-ruby.css'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

export {
  default,
  unstable_settings,
} from '../views/layout/layoutView'
