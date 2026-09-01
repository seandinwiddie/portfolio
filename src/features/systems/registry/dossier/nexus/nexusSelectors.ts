import type React from 'react'
import type { NexusPresentation } from '../../../../components/substrate/kernel/api/apiTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'

export interface NexusPresenceViewModel {
  readonly id: string
  readonly url: string
  readonly label: string
}

export interface NexusViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly available: boolean
  readonly eyebrow: string
  readonly headline: string
  readonly statement: string
  readonly presenceLabel: string
  readonly presences: readonly NexusPresenceViewModel[]
}

export type NexusModuleViewProps = NexusViewProps & {
  readonly observatory: React.ReactNode
}

export const selectNexusViewModel = (
  presentation: NexusPresentation | undefined
): Omit<NexusViewProps, 'dataStatus'> => ({
  available: Boolean(presentation),
  eyebrow: presentation?.eyebrow ?? '',
  headline: presentation?.headline ?? '',
  statement: presentation?.statement ?? '',
  presenceLabel: presentation?.presenceLabel ?? '',
  presences:
    presentation?.presences.map(({ id, url, label }) => ({ id, url, label })) ?? [],
})
