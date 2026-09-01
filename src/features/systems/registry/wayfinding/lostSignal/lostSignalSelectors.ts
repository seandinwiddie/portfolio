import type { LostSignalPresentation } from '../../../../components/substrate/kernel/api/apiTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'

export interface LostSignalViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly eyebrow: string
  readonly headline: string
  readonly statement: string
  readonly actionLabel: string
  readonly actionHref: '/'
}

export const selectLostSignalViewModel = (
  presentation: LostSignalPresentation | undefined
): LostSignalViewProps => ({
  dataStatus: { pendingLabel: null, errorLabel: null },
  eyebrow: presentation?.eyebrow ?? 'UNRESOLVED VECTOR',
  headline: presentation?.headline ?? 'Lost signal',
  statement: presentation?.statement ?? 'This coordinate is outside the registry.',
  actionLabel: presentation?.actionLabel ?? 'Return to ingress',
  actionHref: '/',
})
