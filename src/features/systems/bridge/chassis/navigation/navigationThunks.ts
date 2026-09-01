import React from 'react'
import { usePathname } from 'expo-router'
import {
  overlayDismissed,
  overlayToggled,
} from '../../../../entities/bridge/console/overlayMatrix/overlayMatrixSlice'
import { selectOverlayActive } from '../../../../entities/bridge/console/overlayMatrix/overlayMatrixSelectors'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../substrate/kernel/composition/compositionThunks'
import {
  selectMenuLabel,
  selectMenuText,
  selectNavigationLink,
  type NavigationController,
} from './navigationSelectors'

export const useNavigationComposition = (): NavigationController => {
  const { pending, presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data, isLoading, isUninitialized }) => ({
      pending: isLoading || isUninitialized,
      presentation: data?.presentation?.runtime.navigation,
    }),
  })
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const open = useAppSelector(selectOverlayActive('appearance'))

  const closeMenu = React.useCallback(() => {
    dispatch(overlayDismissed('appearance'))
  }, [dispatch])
  const toggleMenu = React.useCallback(() => {
    dispatch(overlayToggled('appearance'))
  }, [dispatch])
  const closeMenuAndRestoreFocus = React.useCallback(() => {
    closeMenu()
    globalThis.document
      ?.querySelector<HTMLElement>('[aria-controls="registry-appearance-controls"]')
      ?.focus()
  }, [closeMenu])

  React.useEffect(closeMenu, [pathname, closeMenu])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const effect = open
        ? ({ Escape: closeMenuAndRestoreFocus } as const)[event.key]
        : undefined
      effect?.()
      if (effect) event.preventDefault()
    }
    globalThis.document?.addEventListener('keydown', onKey)
    return () => globalThis.document?.removeEventListener('keydown', onKey)
  }, [closeMenuAndRestoreFocus, open])

  return {
    pending,
    open,
    menuLabel: selectMenuLabel(open, presentation),
    menuText: selectMenuText(open, presentation),
    pendingLabel: presentation?.pendingLabel ?? 'Navigation',
    arrayLabel: presentation?.arrayLabel ?? 'Navigation',
    appearanceLabel: presentation?.appearanceLabel ?? '',
    operationsLabel: presentation?.operationsLabel ?? '',
    primaryLabel: presentation?.primaryLabel ?? '',
    nexus: selectNavigationLink('/nexus', pathname)(presentation),
    dossier: selectNavigationLink('/dossier', pathname)(presentation),
    missions: selectNavigationLink('/missions', pathname)(presentation),
    telemetry: selectNavigationLink('/telemetry', pathname)(presentation),
    onToggle: toggleMenu,
    onNavigate: closeMenu,
  }
}
