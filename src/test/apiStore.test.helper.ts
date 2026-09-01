import { apiSlice } from '../features/systems/substrate/kernel/api/apiApi'
import { makeStore } from '../store'

export const setupApiStore = () => ({
  api: apiSlice,
  store: makeStore({ autoBatch: false }),
})
