import type { ErrorInfo } from 'react'

export const reportRenderFailure = (error: unknown, info: ErrorInfo): void => {
  console.error('Uncaught render error:', error, info)
}
