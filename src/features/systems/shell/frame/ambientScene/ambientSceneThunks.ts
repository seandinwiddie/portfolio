import { Platform } from 'react-native'
import { selectAmbientSceneWorld } from '../../../../entities/shell/frame/ambientScene/ambientSceneSlice'
import { selectExperienceMode } from '../../../../entities/shell/controls/experience/experienceSelectors'
import { useAppSelector } from '../../../platform/foundation/composition/compositionThunks'
import {
  selectAmbientSceneViewModel,
  type AmbientSceneViewProps,
} from './ambientSceneSelectors'

export const useAmbientSceneComposition = (): AmbientSceneViewProps =>
  selectAmbientSceneViewModel(useAppSelector(selectAmbientSceneWorld), {
    mode: useAppSelector(selectExperienceMode),
    visible: Platform.OS === 'web',
  })
