export interface ApiDocumentStatusViewModel {
  readonly pendingLabel: string | null
  readonly errorLabel: string | null
  readonly staleLabel?: string | null
}

type ApiDocumentStatusKind = 'ready' | 'stale' | 'pending' | 'error'

interface ApiDocumentQueryState {
  readonly isLoading: boolean
  readonly isError: boolean
  readonly isUninitialized: boolean
  readonly staleLabel?: string
}

const API_DOCUMENT_STATUS_KINDS: Readonly<Record<string, ApiDocumentStatusKind>> = {
  '1:0:0': 'ready',
  '1:0:1': 'stale',
  '1:1:0': 'ready',
  '1:1:1': 'stale',
  '0:1:0': 'pending',
  '0:1:1': 'pending',
  '0:0:1': 'error',
  '0:0:0': 'error',
}

const API_DOCUMENT_STATUS_PROJECTORS: Readonly<
  Record<
    ApiDocumentStatusKind,
    (state: ApiDocumentQueryState) => ApiDocumentStatusViewModel
  >
> = {
  ready: () => ({ pendingLabel: null, errorLabel: null, staleLabel: null }),
  stale: ({ staleLabel }) => ({
    pendingLabel: null,
    errorLabel: null,
    staleLabel: staleLabel ?? 'Registry data stale · reconnecting…',
  }),
  pending: () => ({
    pendingLabel: 'Synchronizing registry data…',
    errorLabel: null,
    staleLabel: null,
  }),
  error: () => ({
    pendingLabel: null,
    errorLabel: 'Registry data unavailable.',
    staleLabel: null,
  }),
}

export const selectApiDocumentStatus = (
  available: boolean,
  state: ApiDocumentQueryState
): ApiDocumentStatusViewModel => {
  const key = `${Number(available)}:${Number(
    state.isLoading || state.isUninitialized
  )}:${Number(state.isError)}`
  const kind = API_DOCUMENT_STATUS_KINDS[key] ?? 'error'
  return API_DOCUMENT_STATUS_PROJECTORS[kind](state)
}
