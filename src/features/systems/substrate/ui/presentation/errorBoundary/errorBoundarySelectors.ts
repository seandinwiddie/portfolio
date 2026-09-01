import type { ReactNode } from 'react'
import type { RuntimePresentation } from '../../../../../components/substrate/kernel/api/presentation/presentationTypes'

export type ErrorBoundaryViewProps = {
  readonly children: ReactNode
  readonly fallback: ErrorBoundaryFallbackViewProps
}

export type ErrorBoundaryFallbackViewProps = RuntimePresentation['errorBoundary']

const EMERGENCY_PRESENTATION: ErrorBoundaryFallbackViewProps = {
  headline: 'Application unavailable',
  message: 'The interface could not render.',
  retryLabel: 'Retry',
}

export const selectErrorBoundaryFallback = (
  presentation: RuntimePresentation['errorBoundary'] | undefined
): ErrorBoundaryFallbackViewProps => ({
  headline: presentation?.headline ?? EMERGENCY_PRESENTATION.headline,
  message: presentation?.message ?? EMERGENCY_PRESENTATION.message,
  retryLabel: presentation?.retryLabel ?? EMERGENCY_PRESENTATION.retryLabel,
})
