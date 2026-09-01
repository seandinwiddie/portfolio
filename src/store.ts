import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from './features/systems/substrate/kernel/api/apiApi'
import { listenerMiddleware } from './features/systems/substrate/kernel/boot/bootListeners'
import { compositionReducers } from './features/systems/substrate/kernel/composition/compositionReducers'
import { initialThemeSelectionState } from './features/entities/bridge/spectrum/themeSelection/themeSelectionSlice'
import { readBrowserBuiltInThemeAtBoot } from './features/systems/bridge/spectrum/themeSelection/themeSelectionAdapters'
import { actionLogMiddleware } from './features/systems/substrate/observability/diagnostics/diagnosticsListeners'
import './features/systems/bridge/console/buttonFx/buttonFxListeners'
import './features/systems/bridge/chassis/signalActivity/signalActivityListeners'
import './features/systems/bridge/console/soundPreference/soundPreferenceListeners'
import './features/systems/bridge/spectrum/themeSelection/themeSelectionListeners'

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

const browserThemeAtBoot = readBrowserBuiltInThemeAtBoot()
const browserPreloadedState: Partial<AppState> | undefined = browserThemeAtBoot
  ? {
      themeSelection: {
        ...initialThemeSelectionState,
        mode: browserThemeAtBoot,
        restorationStatus: 'ready',
        authority: 'stored',
      },
    }
  : undefined

export const store = makeStore({ preloadedState: browserPreloadedState })

setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
