import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from './features/systems/platform/foundation/api/apiApi'
import { listenerMiddleware } from './features/systems/platform/foundation/boot/bootListeners'
import { compositionReducers } from './features/systems/platform/foundation/composition/compositionReducers'
import { actionLogMiddleware } from './features/systems/platform/observability/diagnostics/diagnosticsListeners'
import './features/systems/shell/themes/themeSelection/themeSelectionListeners'
import './features/systems/platform/foundation/api/apiListeners'
import './features/systems/shell/controls/experience/experienceListeners'

const rootReducer = combineReducers({
  ...compositionReducers,
  [apiSlice.reducerPath]: apiSlice.reducer,
})

export type AppState = ReturnType<typeof rootReducer>

interface StoreOptions {
  readonly preloadedState?: Partial<AppState>
  readonly autoBatch?: boolean
}

export const makeStore = ({ preloadedState, autoBatch = true }: StoreOptions = {}) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(apiSlice.middleware, actionLogMiddleware),
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers({ autoBatch }),
  })

export const store = makeStore()

setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
