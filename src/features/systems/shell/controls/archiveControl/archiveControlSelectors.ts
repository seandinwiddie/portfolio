import type { ThemeMode } from '../../../../../styles/themes/themeTypes'
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
  readonly placeholder: string
  readonly isWeb: boolean
  readonly onOpen: () => void
  readonly onClose: () => void
  readonly onEntryChange: (value: string) => void
  readonly onSubmit: () => void
  readonly onInputKey: (key: string) => void
}

const PROMPT = '>'

const QUERY_STATUS_LABELS: Readonly<Record<string, ArchiveFeedState>> = {
  uninitialized: 'IDLE',
  pending: 'SYNC',
  fulfilled: 'LIVE',
  rejected: 'OFFLINE',
}

export const selectArchiveFeedState = (status: string): ArchiveFeedState =>
  QUERY_STATUS_LABELS[status] ?? 'IDLE'

export const selectArchiveLines = (
  lines: readonly string[]
): readonly ArchiveLineViewModel[] =>
  lines.map((text, index) => ({
    id: `${index}-${text}`,
    text,
    className: text.startsWith(PROMPT) ? undefined : 'readout-label',
  }))

export const selectArchivePlaceholder = (mode: ThemeMode): string =>
  `theme ${mode === 'neon' ? 'mirage' : 'neon'}`

export const selectPromptLine = (raw: string): string => `${PROMPT} ${raw}`
