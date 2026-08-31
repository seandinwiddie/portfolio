import { createAction } from '@reduxjs/toolkit'
import type { ExperienceMode } from '../../../../components/shell/controls/experience/experienceTypes'

export const experienceModeCycled = createAction('experience/modeCycled')
export const storedExperienceRestored = createAction<ExperienceMode | null>(
  'experience/storedModeRestored'
)
