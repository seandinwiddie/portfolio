import type { DiagnosticsState } from '../../../../components/platform/observability/diagnostics/diagnosticsTypes'

type DiagnosticsRoot = Readonly<{ diagnostics: DiagnosticsState }>

export const selectActionLog = (state: DiagnosticsRoot) => state.diagnostics.entries
export const selectActionCount = (state: DiagnosticsRoot) =>
  state.diagnostics.entries.length
