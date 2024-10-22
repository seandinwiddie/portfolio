import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { BrandNameState } from '../../data/interfaces';

const brandNameSlice = createSlice({
  name: 'brandName',
  initialState: {} as BrandNameState,
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
});

export const { setBrandName } = brandNameSlice.actions;
export default brandNameSlice.reducer;
