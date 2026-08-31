import { createSelector } from '@reduxjs/toolkit'
import type {
  ExperienceMode,
  ExperienceState,
} from '../../../../components/shell/controls/experience/experienceTypes'

type ExperienceRoot = Readonly<{ experience: ExperienceState }>

export type ExperienceToggleViewProps = Readonly<{
  mode: ExperienceMode
  label: string
  accessibilityLabel: string
  onCycle: () => void
}>

const LABEL_BY_MODE: Readonly<Record<ExperienceMode, string>> = {
  cinematic: 'CINEMATIC',
  quiet: 'QUIET',
}

export const selectExperienceMode = (state: ExperienceRoot): ExperienceMode =>
  state.experience.mode

export const selectIsCinematic = (state: ExperienceRoot): boolean =>
  selectExperienceMode(state) === 'cinematic'

export const selectExperienceToggleViewProps = createSelector(
  [selectExperienceMode],
  (mode): Omit<ExperienceToggleViewProps, 'onCycle'> => {
    const modeLabel = LABEL_BY_MODE[mode]

    return {
      mode,
      label: `FX ${modeLabel}`,
      accessibilityLabel: `Visual experience: ${modeLabel}. Activate to change.`,
    }
  }
)
