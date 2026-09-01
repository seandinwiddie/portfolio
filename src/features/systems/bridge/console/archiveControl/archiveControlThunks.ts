import React from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import type { AppDispatch } from '../../../../../store'
import { selectOverlayActive } from '../../../../entities/bridge/console/overlayMatrix/overlayMatrixSelectors'
import {
  overlayDismissed,
  overlayRequested,
} from '../../../../entities/bridge/console/overlayMatrix/overlayMatrixSlice'
import {
  builtInThemeSelected,
  themeSelectionCycled,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSlice'
import {
  selectThemeMode,
  selectThemes,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSelectors'
import {
  useGetGithubSummaryQuery,
  useGetInitialStateQuery,
} from '../../../substrate/kernel/api/apiApi'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../substrate/kernel/composition/compositionThunks'
import {
  executeArchiveCommand,
  MAX_ARCHIVE_COMMAND_LENGTH,
  normalizeArchiveCommand,
  type ArchiveEffect,
  type ArchiveRoute,
} from './command/commandSelectors'
import {
  selectArchiveFeedState,
  selectArchiveControlCopy,
  selectArchiveLines,
  selectArchivePlaceholder,
  selectPromptLine,
  type ArchiveControlViewProps,
} from './archiveControlSelectors'

type ArchiveEffectPorts = {
  readonly dispatch: AppDispatch
  readonly navigate: (href: ArchiveRoute) => void
}

type EffectHandler = (effect: ArchiveEffect, ports: ArchiveEffectPorts) => void

const EFFECT_HANDLERS: Readonly<Record<ArchiveEffect['type'], EffectHandler>> = {
  none: () => undefined,
  'cycle-theme': (_effect, { dispatch }) => dispatch(themeSelectionCycled()),
  'select-theme': (effect, { dispatch }) =>
    dispatch(
      builtInThemeSelected(
        (effect as Extract<ArchiveEffect, { type: 'select-theme' }>).mode
      )
    ),
  navigate: (effect, { navigate }) =>
    navigate((effect as Extract<ArchiveEffect, { type: 'navigate' }>).href),
}

const applyEffect = (effect: ArchiveEffect, ports: ArchiveEffectPorts): void =>
  EFFECT_HANDLERS[effect.type](effect, ports)

const shortcutKeyOf = (event: KeyboardEvent): string =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
    ? 'mod+k'
    : event.key

export const useArchiveControlComposition = (): ArchiveControlViewProps => {
  const [entry, setEntry] = React.useState('')
  const [rawLines, setRawLines] = React.useState<readonly string[]>([])
  const [announcement, setAnnouncement] = React.useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const open = useAppSelector(selectOverlayActive('archive'))
  const themes = useAppSelector(selectThemes)
  const mode = useAppSelector(selectThemeMode)
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data: initialState }) => ({
      presentation: initialState?.presentation?.runtime.archiveControl,
    }),
  })
  const { data, status, hasData, partial, stale } = useGetGithubSummaryQuery(undefined, {
    skip: !open,
    selectFromResult: ({ data: summary, status: queryStatus }) => ({
      data: summary,
      status: queryStatus,
      hasData: Boolean(summary),
      partial: Boolean(
        summary?.partial ||
          summary?.availability?.partial ||
          summary?.availability?.state === 'partial'
      ),
      stale: Boolean(
        summary?.stale ||
          summary?.availability?.stale ||
          summary?.availability?.state === 'stale'
      ),
    }),
  })
  const feedState = selectArchiveFeedState(presentation)({
    status,
    hasData,
    partial,
    stale,
  })
  const previousOpen = React.useRef(false)

  const close = React.useCallback(() => dispatch(overlayDismissed('archive')), [dispatch])
  const show = React.useCallback(() => dispatch(overlayRequested('archive')), [dispatch])
  const toggle = React.useCallback(() => (open ? close() : show()), [close, open, show])
  const navigate = React.useCallback(
    (href: ArchiveRoute) => {
      close()
      router.push(href)
    },
    [close, router]
  )

  React.useEffect(() => {
    const trigger =
      previousOpen.current && !open
        ? globalThis.document?.querySelector<HTMLElement>(
            '[data-testid="archive-control-trigger"]'
          )
        : null
    trigger?.focus()
    previousOpen.current = open
  }, [open])

  React.useEffect(() => {
    if (presentation) {
      setRawLines((previous) =>
        previous.length === 0 ? presentation.initialLines : previous
      )
    }
  }, [presentation])

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
    const raw = normalizeArchiveCommand(entry)
    setEntry('')
    if (raw.length === 0 || !presentation) return

    const result = executeArchiveCommand(raw, {
      data,
      feedState,
      themes,
      copy: presentation.commands,
    })
    applyEffect(result.effect, { dispatch, navigate })
    setAnnouncement(result.lines[result.lines.length - 1] ?? '')
    setRawLines((previous) =>
      [...previous, selectPromptLine(raw), ...result.lines].slice(-120)
    )
  }, [data, dispatch, entry, feedState, navigate, presentation, themes])

  const onDialogMount = React.useCallback((node: HTMLDialogElement | null) => {
    if (node && !node.open && typeof node.showModal === 'function') node.showModal()
  }, [])

  const onDialogCancel = React.useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault()
      close()
    },
    [close]
  )

  return {
    open,
    entry,
    lines: selectArchiveLines(rawLines),
    announcement,
    placeholder: selectArchivePlaceholder(mode, presentation),
    ...selectArchiveControlCopy(presentation),
    isWeb: Platform.OS === 'web',
    onOpen: show,
    onClose: close,
    onEntryChange: (value) => setEntry(value.slice(0, MAX_ARCHIVE_COMMAND_LENGTH)),
    onSubmit: submit,
    onInputKey: (key) => ({ Escape: close })[key]?.(),
    onDialogMount,
    onDialogCancel,
  }
}
