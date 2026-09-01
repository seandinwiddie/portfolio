import type { DiagnosticsState } from '../../../../components/substrate/observability/diagnostics/diagnosticsTypes'

type DiagnosticsRoot = Readonly<{ diagnostics: DiagnosticsState }>

export const selectActionLog = (state: DiagnosticsRoot) => state.diagnostics.entries
export const selectActionCount = (state: DiagnosticsRoot) =>
  state.diagnostics.entries.length
