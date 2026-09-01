import type { RuntimeTelemetryPresentation } from '../../../../../components/substrate/kernel/api/presentation/presentationTypes'

const EMPTY_VALUES: Readonly<Record<string, string>> = {
  timing: '',
  probing: '',
  keys: '',
  units: '',
  loaded: '',
  actions: '',
  store: '',
  noneYet: '',
  respected: '',
  notRequested: '',
  network: '',
  stale: '',
  syncing: '',
  unavailable: '',
  reachable: '',
  unreachable: '',
  refreshing: '',
  fetching: '',
  aggregated: '',
  noData: '',
  loading: '',
  error: '',
  connected: '',
}

/** Accessibility-neutral projection used only until the API document arrives. */
export const EMPTY_TELEMETRY_PRESENTATION: RuntimeTelemetryPresentation = {
  eyebrow: '',
  statement: '',
  panels: { uplink: '', payload: '', theme: '', runtime: '' },
  latencyUnit: '',
  emptyLabel: '',
  sourceLabel: '',
  labels: {},
  values: EMPTY_VALUES,
  overall: { nominal: '', syncing: '', degraded: '' },
  deck: { heading: '', api: '', theme: '', brand: '' },
}
