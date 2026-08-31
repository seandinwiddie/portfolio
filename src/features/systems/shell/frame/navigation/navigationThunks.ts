import React from 'react'
import { usePathname } from 'expo-router'
import { useMedia } from 'tamagui'
import { selectBrandNameLoading } from '../../../../entities/shell/frame/brandName/brandNameSlice'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import {
  selectMenuLabel,
  selectMenuText,
  selectNavigationLink,
  type NavigationController,
} from './navigationSelectors'

export const useNavigationComposition = (): NavigationController => {
  const pending = useAppSelector(selectBrandNameLoading)
  const media = useMedia()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const compact = !media.gtSm

  const closeMenu = React.useCallback(() => setOpen(false), [])
  const toggleMenu = React.useCallback(() => setOpen((wasOpen) => !wasOpen), [])

  React.useEffect(closeMenu, [pathname, closeMenu])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => ({ Escape: closeMenu })[event.key]?.()
    globalThis.document?.addEventListener('keydown', onKey)
    return () => globalThis.document?.removeEventListener('keydown', onKey)
  }, [closeMenu])

  return {
    pending,
    compact,
    open,
    menuLabel: selectMenuLabel(open),
    menuText: selectMenuText(open),
    home: selectNavigationLink('/home', pathname),
    about: selectNavigationLink('/about', pathname),
    projects: selectNavigationLink('/projects', pathname),
    status: selectNavigationLink('/status', pathname),
    onToggle: toggleMenu,
    onNavigate: closeMenu,
  }
}
