import type { ReactNode } from 'react'

export type NavigationHref = '/home' | '/about' | '/projects' | '/status'

export type NavigationLinkViewProps = {
  readonly href: NavigationHref
  readonly label: string
  readonly current: 'page' | undefined
}

export type NavigationLinkControlViewProps = NavigationLinkViewProps & {
  readonly onNavigate: () => void
}

export type NavigationLinksViewProps = Pick<
  NavigationViewProps,
  'home' | 'about' | 'projects' | 'status' | 'onNavigate'
>

export type NavigationControls = {
  readonly brand: ReactNode
  readonly themeToggle: ReactNode
  readonly themeCustom: ReactNode
  readonly experienceToggle: ReactNode
}

export type NavigationViewProps = {
  readonly pending: boolean
  readonly compact: boolean
  readonly open: boolean
  readonly menuLabel: string
  readonly menuText: string
  readonly home: NavigationLinkViewProps
  readonly about: NavigationLinkViewProps
  readonly projects: NavigationLinkViewProps
  readonly status: NavigationLinkViewProps
  readonly controls: NavigationControls
  readonly onToggle: () => void
  readonly onNavigate: () => void
}

export type NavigationController = Omit<NavigationViewProps, 'controls'>

export const selectNavigationLink = (
  href: NavigationHref,
  pathname: string
): NavigationLinkViewProps => ({
  href,
  label: href.slice(1).replace(/^./, (letter) => letter.toUpperCase()),
  current: pathname === href ? 'page' : undefined,
})

export const selectMenuLabel = (open: boolean): string =>
  open ? 'Close menu' : 'Open menu'

export const selectMenuText = (open: boolean): string => (open ? '✕ CLOSE' : '☰ MENU')
