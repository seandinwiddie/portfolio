import React from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'
const serverSnapshot = () => false
const browserSnapshot = () => window.matchMedia(QUERY).matches

const subscribe = (notify: () => void): (() => void) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

/** Reactive web preference; SSR and native settle immediately with motion disabled in component code. */
export const useReducedMotion = (): boolean =>
  React.useSyncExternalStore(
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? () => () => undefined
      : subscribe,
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? serverSnapshot
      : browserSnapshot,
    serverSnapshot
  )
