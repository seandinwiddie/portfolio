import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';

const bodySlice = createSlice({
  name: 'body',
  initialState: {
    description: '',
    portfolioFeatures: [],
  },
  reducers: {
    setDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
    },
    setPortfolioFeatures: (state, action: PayloadAction<any[]>) => {
      state.portfolioFeatures = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        if (payload) {
          state.description = payload.description;
          state.portfolioFeatures = payload.portfolioFeatures;
        }
      }
    );
  },
});

export const { setDescription, setPortfolioFeatures } = bodySlice.actions;
export default bodySlice.reducer;
