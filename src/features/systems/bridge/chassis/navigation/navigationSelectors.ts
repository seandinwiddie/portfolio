import type { ReactNode } from 'react'
import type { RuntimeNavigationPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'

export type NavigationHref = '/nexus' | '/dossier' | '/missions' | '/telemetry'

export type NavigationLinkViewProps = {
  readonly href: NavigationHref
  readonly index: string
  readonly label: string
  readonly systemLabel: string
  readonly current: 'page' | undefined
}

export type NavigationLinkControlViewProps = NavigationLinkViewProps & {
  readonly onNavigate: () => void
}

export type NavigationLinkControlPresentationViewProps =
  NavigationLinkControlViewProps & {
    readonly presentation: NavigationPresentation
  }

export type NavigationLinksViewProps = Pick<
  NavigationViewProps,
  'nexus' | 'dossier' | 'missions' | 'telemetry' | 'onNavigate'
> & {
  readonly presentation: NavigationPresentation
}

export type NavigationPresentation = 'dock' | 'rail'

export type NavigationControls = {
  readonly brand: ReactNode
  readonly themeToggle: ReactNode
  readonly themeCustom: ReactNode
  readonly soundPreference: ReactNode
}

export type NavigationViewProps = {
  readonly pending: boolean
  readonly open: boolean
  readonly menuLabel: string
  readonly menuText: string
  readonly pendingLabel: string
  readonly arrayLabel: string
  readonly appearanceLabel: string
  readonly operationsLabel: string
  readonly primaryLabel: string
  readonly nexus: NavigationLinkViewProps
  readonly dossier: NavigationLinkViewProps
  readonly missions: NavigationLinkViewProps
  readonly telemetry: NavigationLinkViewProps
  readonly controls: NavigationControls
  readonly onToggle: () => void
  readonly onNavigate: () => void
}

export type NavigationController = Omit<NavigationViewProps, 'controls'>

const STRUCTURAL_ROUTES: Readonly<
  Record<NavigationHref, Pick<NavigationLinkViewProps, 'index' | 'label' | 'systemLabel'>>
> = {
  '/nexus': { index: '', label: 'nexus', systemLabel: '' },
  '/dossier': { index: '', label: 'dossier', systemLabel: '' },
  '/missions': { index: '', label: 'missions', systemLabel: '' },
  '/telemetry': { index: '', label: 'telemetry', systemLabel: '' },
}

export const selectNavigationAriaLabel = (label: string, systemLabel: string): string =>
  [label, systemLabel].filter(Boolean).join(' — ')

export const selectNavigationLink =
  (href: NavigationHref, pathname: string) =>
  (presentation: RuntimeNavigationPresentation | undefined): NavigationLinkViewProps => ({
    href,
    ...(presentation?.routes[href.slice(1) as keyof typeof presentation.routes] ??
      STRUCTURAL_ROUTES[href]),
    current: pathname === href ? 'page' : undefined,
  })

export const selectMenuLabel = (
  open: boolean,
  presentation: RuntimeNavigationPresentation | undefined
): string =>
  (open ? presentation?.menu.closeLabel : presentation?.menu.openLabel) ??
  (open ? 'Close controls' : 'Open controls')

export const selectMenuText = (
  open: boolean,
  presentation: RuntimeNavigationPresentation | undefined
): string =>
  (open ? presentation?.menu.closeText : presentation?.menu.openText) ??
  (open ? 'Close' : 'Controls')
