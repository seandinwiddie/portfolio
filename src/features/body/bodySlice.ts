import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import type { About, ContentItem } from '../../data/schemas';

interface BodyState {
  portfolioFeatures: ContentItem[];
  appProcedures: ContentItem[];
  brandName: string;
  description: string;
  brandNameLoading: { isLoading: boolean };
  source: 'network' | 'fallback' | 'pending';
  about: About | null;
}

const initialState: BodyState = {
  portfolioFeatures: [],
  appProcedures: [],
  brandName: '',
  description: '',
  brandNameLoading: { isLoading: true },
  source: 'pending',
  about: null,
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
        state.source = payload.source ?? 'network';
        state.about = payload.about ?? state.about;
      }
    );
  },
  selectors: {
    selectPortfolioFeatures: (state) => state.portfolioFeatures,
    selectAppProcedures: (state) => state.appProcedures,
    selectDescription: (state) => state.description,
    selectDataSource: (state) => state.source,
    selectAbout: (state) => state.about,
  },
});

export const {
  selectPortfolioFeatures,
  selectAppProcedures,
  selectDescription,
  selectDataSource,
  selectAbout,
} = bodySlice.selectors;
export default bodySlice.reducer;
