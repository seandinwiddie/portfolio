import { apiSlice } from '../features/systems/platform/foundation/api/apiApi'
import { makeStore } from '../store'

export const setupApiStore = () => ({
  api: apiSlice,
  store: makeStore({ autoBatch: false }),
})
