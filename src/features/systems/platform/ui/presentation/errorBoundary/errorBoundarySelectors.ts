import type { ReactNode } from 'react'

export type ErrorBoundaryViewProps = {
  readonly children: ReactNode
}

export const selectRenderFailureMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
