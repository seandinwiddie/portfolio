import { createSlice } from '@reduxjs/toolkit'
import type { BrandNameState } from '../../../../components/shell/frame/brandName/brandNameTypes'
import {
  brandNameLoadFailed,
  brandNameLoadStarted,
  brandNameReceived,
} from './brandNameActions'

const initialState: BrandNameState = {
  value: '',
  isLoading: false,
}

const brandNameSlice = createSlice({
  name: 'brandName',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(brandNameLoadStarted, (state) => {
        state.isLoading = true
      })
      .addCase(brandNameReceived, (state, { payload }) => {
        state.value = payload
        state.isLoading = false
      })
      .addCase(brandNameLoadFailed, (state) => {
        state.isLoading = false
      })
  },
  selectors: {
    selectBrandName: (state) => state.value,
    selectBrandNameLoading: (state) => state.isLoading,
  },
})

export const { selectBrandName, selectBrandNameLoading } = brandNameSlice.selectors
export default brandNameSlice.reducer
