import { _, multiMatch, orElse } from 'functional-programming-composition'
import type { ThemeMode } from '../../../../../styles/themes/themeTypes'
import type { RuntimeArchivePresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { ArchiveFeedState } from './command/commandSelectors'

export type ArchiveLineViewModel = {
  readonly id: string
  readonly text: string
  readonly className: string | undefined
}

export type ArchiveControlViewProps = {
  readonly open: boolean
  readonly entry: string
  readonly lines: readonly ArchiveLineViewModel[]
  readonly announcement: string
  readonly placeholder: string
  readonly heading: string
  readonly closeLabel: string
  readonly closeText: string
  readonly commandLabel: string
  readonly dialogLabel: string
  readonly openLabel: string
  readonly triggerLabel: string
  readonly isWeb: boolean
  readonly onOpen: () => void
  readonly onClose: () => void
  readonly onEntryChange: (value: string) => void
  readonly onSubmit: () => void
  readonly onInputKey: (key: string) => void
  readonly onDialogMount: (node: HTMLDialogElement | null) => void
  readonly onDialogCancel: (event: { preventDefault: () => void }) => void
}

export type ArchiveControlCopy = Pick<
  ArchiveControlViewProps,
  | 'heading'
  | 'closeLabel'
  | 'closeText'
  | 'commandLabel'
  | 'dialogLabel'
  | 'openLabel'
  | 'triggerLabel'
>

const PROMPT = '>'

const QUERY_STATUS_KEYS: Readonly<
  Record<string, keyof RuntimeArchivePresentation['feedStates']>
> = {
  uninitialized: 'idle',
  pending: 'sync',
  fulfilled: 'live',
  rejected: 'offline',
}

export interface ArchiveFeedInput {
  readonly status: string
  readonly hasData: boolean
  readonly stale: boolean
  readonly partial: boolean
}

export const selectArchiveFeedState =
  (presentation: RuntimeArchivePresentation | undefined) =>
  (input: ArchiveFeedInput): ArchiveFeedState => {
    const retainedAfterFailure = input.status === 'rejected' && input.hasData
    const key = orElse(
      multiMatch<ArchiveFeedInput, keyof RuntimeArchivePresentation['feedStates']>(
        input,
        [
          [() => input.stale || retainedAfterFailure, () => 'stale'],
          [() => input.status === 'fulfilled' && input.partial, () => 'partial'],
          [() => input.status === 'fulfilled', () => 'live'],
          [_, () => QUERY_STATUS_KEYS[input.status] ?? 'idle'],
        ]
      ),
      'idle'
    )
    return presentation?.feedStates[key] ?? ''
  }

export const selectArchiveLines = (
  lines: readonly string[]
): readonly ArchiveLineViewModel[] =>
  lines.map((text, index) => ({
    id: `${index}-${text}`,
    text,
    className: text.startsWith(PROMPT) ? undefined : 'readout-label',
  }))

export const selectArchivePlaceholder = (
  mode: ThemeMode,
  presentation: RuntimeArchivePresentation | undefined
): string =>
  (mode === 'neon'
    ? presentation?.placeholders.mirage
    : presentation?.placeholders.neon) ?? ''

export const selectArchiveControlCopy = (
  presentation: RuntimeArchivePresentation | undefined
): ArchiveControlCopy => ({
  heading: presentation?.heading ?? 'Command console',
  closeLabel: presentation?.closeLabel ?? 'Close command console',
  closeText: presentation?.closeText ?? 'Close',
  commandLabel: presentation?.commandLabel ?? 'Command input',
  dialogLabel: presentation?.dialogLabel ?? 'Command console',
  openLabel: presentation?.openLabel ?? 'Open command console',
  triggerLabel: presentation?.triggerLabel ?? 'Console',
})

export const selectPromptLine = (raw: string): string => `${PROMPT} ${raw}`
