import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';

interface PortfolioFeature {
  title: string;
  description: string;
}

interface BodyState {
  description: string;
  portfolioFeatures: PortfolioFeature[];
}

const bodySlice = createSlice({
  name: 'body',
  initialState: {
    description: '',
    portfolioFeatures: [],
  } as BodyState,
  reducers: {
    setDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
    },
    setPortfolioFeatures: (state, action: PayloadAction<PortfolioFeature[]>) => {
      state.portfolioFeatures = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        state.description = payload.description;
        state.portfolioFeatures = payload.portfolioFeatures;
      }
    );
  },
});

export const { setDescription, setPortfolioFeatures } = bodySlice.actions;
export default bodySlice.reducer;
