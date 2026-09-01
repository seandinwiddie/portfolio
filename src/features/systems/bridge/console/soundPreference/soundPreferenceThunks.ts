import React from 'react'
import {
  soundPreferenceToggled,
  storedSoundPreferenceRestored,
} from '../../../../entities/bridge/console/soundPreference/soundPreferenceSlice'
import {
  selectSoundPreferenceViewModel,
  type SoundPreferenceViewProps,
} from '../../../../entities/bridge/console/soundPreference/soundPreferenceSelectors'
import { useGetInitialStateQuery } from '../../../substrate/kernel/api/apiApi'
import {
  useAppDispatch,
  useAppSelector,
} from '../../../substrate/kernel/composition/compositionThunks'
import { readBrowserSoundPreference } from './soundPreferenceAdapters'

export const useSoundPreferenceComposition = (): SoundPreferenceViewProps => {
  const dispatch = useAppDispatch()
  const { presentation } = useGetInitialStateQuery(undefined, {
    selectFromResult: ({ data }) => ({
      presentation: data?.presentation?.runtime.sound,
    }),
  })
  const viewModel = useAppSelector((state) =>
    selectSoundPreferenceViewModel(state, presentation)
  )

  React.useEffect(() => {
    dispatch(storedSoundPreferenceRestored(readBrowserSoundPreference()))
  }, [dispatch])

  const onToggle = React.useCallback(() => dispatch(soundPreferenceToggled()), [dispatch])

  return { ...viewModel, onToggle }
}
