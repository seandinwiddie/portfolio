import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import type { ContentItem } from '../../data/schemas';

interface BodyState {
  portfolioFeatures: ContentItem[];
  appProcedures: ContentItem[];
  brandName: string;
  description: string;
  brandNameLoading: { isLoading: boolean };
}

const initialState: BodyState = {
  portfolioFeatures: [],
  appProcedures: [],
  brandName: '',
  description: '',
  brandNameLoading: { isLoading: true },
};

const bodySlice = createSlice({
  name: 'body',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.getInitialState.matchFulfilled,
      // No logging here: reducers must stay pure, and this one ran a console.log
      // on every fulfilled request.
      (state, { payload }) => {
        state.portfolioFeatures = payload.portfolioFeatures ?? [];
        state.appProcedures = payload.appProcedures ?? [];
        state.brandName = payload.brandName ?? '';
        state.description = payload.description ?? '';
        state.brandNameLoading = payload.brandNameLoading ?? { isLoading: false };
      }
    );
  },
  selectors: {
    selectPortfolioFeatures: (state) => state.portfolioFeatures,
    selectAppProcedures: (state) => state.appProcedures,
    selectDescription: (state) => state.description,
  },
});

export const { selectPortfolioFeatures, selectAppProcedures, selectDescription } =
  bodySlice.selectors;
export default bodySlice.reducer;
