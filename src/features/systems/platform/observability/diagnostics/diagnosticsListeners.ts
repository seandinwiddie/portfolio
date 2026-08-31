import { isAction, isAnyOf, type Middleware } from '@reduxjs/toolkit'
import {
  diagnosticActionObserved,
  diagnosticsCleared,
} from '../../../../entities/platform/observability/diagnostics/diagnosticsActions'

const isDiagnosticsAction = isAnyOf(diagnosticActionObserved, diagnosticsCleared)

const actionTypeOf = (action: unknown): string =>
  isAction(action) ? action.type : 'unknown'

export const actionLogMiddleware: Middleware = (middlewareApi) => (next) => (action) => {
  const result = next(action)
  const record = isDiagnosticsAction(action)
    ? () => undefined
    : () =>
        middlewareApi.dispatch(
          diagnosticActionObserved({ type: actionTypeOf(action), at: Date.now() })
        )

  record()

  return result
}
