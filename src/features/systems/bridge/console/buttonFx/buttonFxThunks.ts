import { useEffect } from 'react'
import {
  buttonFxHovered,
  buttonFxPressed,
} from '../../../../entities/bridge/console/buttonFx/buttonFxActions'
import { useAppDispatch } from '../../../substrate/kernel/composition/compositionThunks'
import { installButtonFxDelegation } from './buttonFxAdapters'

export const useButtonFxComposition = (): void => {
  const dispatch = useAppDispatch()

  useEffect(
    () =>
      installButtonFxDelegation({
        hover: (identity) => dispatch(buttonFxHovered({ identity })),
        press: (identity) => dispatch(buttonFxPressed({ identity })),
      }),
    [dispatch]
  )
}
