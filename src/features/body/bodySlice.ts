import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';

const initialState = {
  portfolioFeatures: [],
  appProcedures: [],
  brandName: '',
  description: '',
  brandNameLoading: { isLoading: true }
};

const bodySlice = createSlice({
  name: 'body',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.getInitialState.matchFulfilled,
      (state, { payload }) => {
        console.log('Updating body state with:', payload);
        state.portfolioFeatures = payload.portfolioFeatures || [];
        state.appProcedures = payload.appProcedures || [];
        state.brandName = payload.brandName || '';
        state.description = payload.description || '';
        state.brandNameLoading = payload.brandNameLoading || { isLoading: false };
      }
    );
  },
});

export default bodySlice.reducer;
