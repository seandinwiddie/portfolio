import { Platform } from 'react-native'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import { selectSignalActivityState } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySelectors'
import { useAppSelector } from '../../../substrate/kernel/composition/compositionThunks'
import {
  selectAmbientSceneViewModel,
  type AmbientSceneViewProps,
} from './ambientSceneSelectors'

export const useAmbientSceneComposition = (): AmbientSceneViewProps => {
  const { world } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ world: data?.ambientScene ?? null }),
  })
  const activity = useAppSelector(selectSignalActivityState)

  return selectAmbientSceneViewModel(world, Platform.OS === 'web')(activity)
}
