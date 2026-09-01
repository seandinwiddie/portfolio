import React from 'react'
import { fromNullable, match } from 'functional-programming-composition'
import { routeTransmissionResolved } from '../../../../entities/bridge/chassis/signalActivity/signalActivitySlice'
import { useAppDispatch } from '../../../substrate/kernel/composition/compositionThunks'

export const useSignalActivityNavigation = (pathname: string): void => {
  const dispatch = useAppDispatch()
  const previousPathname = React.useRef(pathname)

  React.useEffect(() => {
    const routeEvent =
      previousPathname.current === pathname ? null : routeTransmissionResolved()
    previousPathname.current = pathname
    match(fromNullable(routeEvent), dispatch, () => undefined)
  }, [dispatch, pathname])
}
