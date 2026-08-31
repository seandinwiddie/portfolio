import {
  ambientSceneReceived,
  ambientSceneRequestFailed,
  ambientSceneRequestStarted,
} from '../../../../entities/shell/frame/ambientScene/ambientSceneActions'
import {
  bodyDataReceived,
  bodyDataRequestFailed,
  bodyDataRequestStarted,
} from '../../../../entities/portfolio/profile/body/bodyActions'
import {
  brandNameLoadFailed,
  brandNameLoadStarted,
  brandNameReceived,
} from '../../../../entities/shell/frame/brandName/brandNameActions'
import { navBrandNameReceived } from '../../../../entities/shell/frame/navigation/navigationActions'
import { startAppListening } from '../boot/bootListeners'
import { apiSlice } from './apiApi'

startAppListening({
  matcher: apiSlice.endpoints.getInitialState.matchPending,
  effect: (_action, { dispatch }) => {
    dispatch(bodyDataRequestStarted())
    dispatch(ambientSceneRequestStarted())
    dispatch(brandNameLoadStarted())
  },
})

startAppListening({
  matcher: apiSlice.endpoints.getInitialState.matchFulfilled,
  effect: ({ payload }, { dispatch }) => {
    dispatch(bodyDataReceived(payload))
    dispatch(ambientSceneReceived(payload.ambientScene))
    dispatch(brandNameReceived(payload.brandName))
    dispatch(navBrandNameReceived(payload.brandName))
  },
})

startAppListening({
  matcher: apiSlice.endpoints.getInitialState.matchRejected,
  effect: (_action, { dispatch }) => {
    dispatch(bodyDataRequestFailed())
    dispatch(ambientSceneRequestFailed())
    dispatch(brandNameLoadFailed())
  },
})
