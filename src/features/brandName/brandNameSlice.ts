import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { BrandNameState } from '../../data/interfaces';

const initialState: BrandNameState = {
  value: '',
  isLoading: false,
};

const brandNameSlice = createSlice({
  name: 'brandName',
  initialState,
  reducers: {
    setBrandName: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        apiSlice.endpoints.getInitialState.matchPending,
        (state) => {
          state.isLoading = true;
        }
      )
      .addMatcher(
        apiSlice.endpoints.getInitialState.matchFulfilled,
        (state, { payload }) => {
          state.value = payload.brandName;
          state.isLoading = false;
        }
      )
      .addMatcher(
        apiSlice.endpoints.getInitialState.matchRejected,
        (state) => {
          state.isLoading = false;
        }
      );
  },
  selectors: {
    selectBrandName: (state) => state.value,
    selectBrandNameLoading: (state) => state.isLoading,
  },
});

export const { setBrandName } = brandNameSlice.actions;
export const { selectBrandName, selectBrandNameLoading } = brandNameSlice.selectors;
export default brandNameSlice.reducer;
