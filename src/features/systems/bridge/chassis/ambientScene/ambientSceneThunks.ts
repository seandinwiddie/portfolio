import { Platform } from 'react-native'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import {
  selectAmbientSceneViewModel,
  type AmbientSceneViewProps,
} from './ambientSceneSelectors'

export const useAmbientSceneComposition = (): AmbientSceneViewProps => {
  const { world } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({ world: data?.ambientScene ?? null }),
  })

  return selectAmbientSceneViewModel(world, Platform.OS === 'web')
}
