import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { AppDispatch, AppState } from '../../../../../store'

export const reportListenerError = (error: unknown): never => {
  throw error
}

export const listenerMiddleware = createListenerMiddleware({
  onError: reportListenerError,
})

export const startAppListening = listenerMiddleware.startListening.withTypes<
  AppState,
  AppDispatch
>()
