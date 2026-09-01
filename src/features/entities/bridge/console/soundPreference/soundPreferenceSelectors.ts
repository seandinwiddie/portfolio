import { createSelector } from '@reduxjs/toolkit'
import type { RuntimeSoundPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { SoundPreferenceState } from './soundPreferenceSlice'

type SoundPreferenceRoot = Readonly<{ soundPreference: SoundPreferenceState }>

export type SoundPreferenceViewProps = Readonly<{
  enabled: boolean
  ready: boolean
  text: string
  label: string
  onToggle: () => void
}>

export const selectSoundPreferenceState = (
  state: SoundPreferenceRoot
): SoundPreferenceState => state.soundPreference

export const selectSoundPreferenceEnabled = (state: SoundPreferenceRoot): boolean =>
  selectSoundPreferenceState(state).enabled

export const selectSoundPreferenceRestorationReady = (
  state: SoundPreferenceRoot
): boolean => selectSoundPreferenceState(state).restorationStatus === 'ready'

export const selectSoundPlaybackEnabled = (state: SoundPreferenceRoot): boolean =>
  selectSoundPreferenceRestorationReady(state) && selectSoundPreferenceEnabled(state)

const selectSoundPresentation = (
  _state: SoundPreferenceRoot,
  presentation: RuntimeSoundPresentation | undefined
) => presentation

export const selectSoundPreferenceViewModel = createSelector(
  [selectSoundPreferenceState, selectSoundPresentation],
  (preference, presentation): Omit<SoundPreferenceViewProps, 'onToggle'> => ({
    enabled: preference.enabled,
    ready: preference.restorationStatus === 'ready' && presentation !== undefined,
    text:
      presentation?.[
        preference.enabled ? ('enabledText' as const) : ('disabledText' as const)
      ] ?? '',
    label:
      presentation?.[
        preference.enabled ? ('disableLabel' as const) : ('enableLabel' as const)
      ] ?? '',
  })
)
