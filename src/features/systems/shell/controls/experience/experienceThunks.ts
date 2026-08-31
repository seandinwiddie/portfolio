import { createAsyncThunk } from '@reduxjs/toolkit'
import { experienceModeCycled } from '../../../../entities/shell/controls/experience/experienceActions'
import {
  selectExperienceToggleViewProps,
  type ExperienceToggleViewProps,
} from '../../../../entities/shell/controls/experience/experienceSelectors'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../platform/foundation/composition/compositionThunks'
import { loadStoredExperience } from './experienceAdapters'

export const restoreExperience = createAsyncThunk(
  'experience/restoreRequested',
  loadStoredExperience
)

export const useExperienceToggleComposition = (): ExperienceToggleViewProps => {
  const dispatch = useAppDispatch()
  const viewProps = useAppSelector(selectExperienceToggleViewProps)

  return {
    ...viewProps,
    onCycle: () => dispatch(experienceModeCycled()),
  }
}
