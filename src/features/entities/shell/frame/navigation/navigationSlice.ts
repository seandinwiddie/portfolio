import { createSlice } from '@reduxjs/toolkit'
import type { NavigationState } from '../../../../components/shell/frame/navigation/navigationTypes'
import { navBrandNameReceived } from './navigationActions'

const initialState: NavigationState = { brandName: '' }

const navSlice = createSlice({
  name: 'nav',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(navBrandNameReceived, (state, { payload }) => {
      state.brandName = payload
    })
  },
  selectors: {
    selectNavBrandName: (state) => state.brandName,
  },
})

export const { selectNavBrandName } = navSlice.selectors
export default navSlice.reducer
