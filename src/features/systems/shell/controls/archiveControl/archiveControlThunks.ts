import React from 'react'
import { Platform } from 'react-native'
import type { AppDispatch } from '../../../../../store'
import {
  builtInThemeSelected,
  themeSelectionCycled,
} from '../../../../entities/shell/themes/themeSelection/themeSelectionSlice'
import {
  selectThemeMode,
  selectThemes,
} from '../../../../entities/shell/themes/themeSelection/themeSelectionSelectors'
import { useGetGithubSummaryQuery } from '../../../platform/foundation/api/apiApi'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../platform/foundation/composition/compositionThunks'
import { executeArchiveCommand, type ArchiveEffect } from './command/commandSelectors'
import {
  selectArchiveFeedState,
  selectArchiveLines,
  selectArchivePlaceholder,
  selectPromptLine,
  type ArchiveControlViewProps,
} from './archiveControlSelectors'

const INITIAL_LINES = ['ARCHIVE CONTROL // interface ready', 'type `help` for commands.']

const applyEffect = (effect: ArchiveEffect, dispatch: AppDispatch): void => {
  if (effect.type === 'cycle-theme') dispatch(themeSelectionCycled())
  if (effect.type === 'select-theme') dispatch(builtInThemeSelected(effect.mode))
}

const shortcutKeyOf = (event: KeyboardEvent): string =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
    ? 'mod+k'
    : event.key

export const useArchiveControlComposition = (): ArchiveControlViewProps => {
  const [open, setOpen] = React.useState(false)
  const [entry, setEntry] = React.useState('')
  const [rawLines, setRawLines] = React.useState<readonly string[]>(INITIAL_LINES)
  const dispatch = useAppDispatch()
  const themes = useAppSelector(selectThemes)
  const mode = useAppSelector(selectThemeMode)
  const { data, status } = useGetGithubSummaryQuery()
  const feedState = selectArchiveFeedState(status)
  const previousOpen = React.useRef(false)

  const close = React.useCallback(() => setOpen(false), [])
  const show = React.useCallback(() => setOpen(true), [])
  const toggle = React.useCallback(() => setOpen((wasOpen) => !wasOpen), [])

  React.useEffect(() => {
    const trigger =
      previousOpen.current && !open
        ? globalThis.document?.querySelector<HTMLElement>(
            '[aria-label="Open Archive Control"]'
          )
        : null
    trigger?.focus()
    previousOpen.current = open
  }, [open])

  React.useEffect(() => {
    const keyEffects: Readonly<Partial<Record<string, () => void>>> = {
      '`': toggle,
      'mod+k': toggle,
      Escape: close,
    }
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (typing) return
      const effect = keyEffects[shortcutKeyOf(event)]
      effect?.()
      if (effect) event.preventDefault()
    }
    globalThis.document?.addEventListener('keydown', onKey)
    return () => globalThis.document?.removeEventListener('keydown', onKey)
  }, [close, toggle])

  const submit = React.useCallback(() => {
    const raw = entry.trim()
    setEntry('')
    if (raw.length === 0) return

    const result = executeArchiveCommand(raw, { data, feedState, themes })
    applyEffect(result.effect, dispatch)
    setRawLines((previous) =>
      [...previous, selectPromptLine(raw), ...result.lines].slice(-120)
    )
  }, [data, dispatch, entry, feedState, themes])

  return {
    open,
    entry,
    lines: selectArchiveLines(rawLines),
    placeholder: selectArchivePlaceholder(mode),
    isWeb: Platform.OS === 'web',
    onOpen: show,
    onClose: close,
    onEntryChange: setEntry,
    onSubmit: submit,
    onInputKey: (key) => ({ Escape: close })[key]?.(),
  }
}
