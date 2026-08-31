import { createAction } from '@reduxjs/toolkit'
import type { ObservedAction } from '../../../../components/platform/observability/diagnostics/diagnosticsTypes'

export const diagnosticActionObserved = createAction<ObservedAction>(
  'diagnostics/actionObserved'
)

export const diagnosticsCleared = createAction('diagnostics/cleared')
