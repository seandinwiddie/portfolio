import {
  experienceModeCycled,
  storedExperienceRestored,
} from '../../../../entities/shell/controls/experience/experienceActions'
import { startAppListening } from '../../../platform/foundation/boot/bootListeners'
import { saveStoredExperience } from './experienceAdapters'
import { restoreExperience } from './experienceThunks'

startAppListening({
  actionCreator: restoreExperience.fulfilled,
  effect: ({ payload }, { dispatch }) => {
    dispatch(storedExperienceRestored(payload))
  },
})

startAppListening({
  actionCreator: experienceModeCycled,
  effect: async (_action, listenerApi) =>
    saveStoredExperience(listenerApi.getState().experience.mode),
})
