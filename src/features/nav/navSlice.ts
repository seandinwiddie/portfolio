import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { NavState } from '../../data/interfaces';

const initialState: NavState = { brandName: '' };

const navSlice = createSlice({
  name: 'nav',
  initialState,
  reducers: {
    setBrandName: (state, action: PayloadAction<string>) => {
      state.brandName = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.getInitialState.matchFulfilled,
      (state, { payload }) => {
        state.brandName = payload.brandName;
      }
    );
  },
  selectors: {
    selectNavBrandName: (state) => state.brandName,
  },
});

export const { setBrandName } = navSlice.actions;
export const { selectNavBrandName } = navSlice.selectors;
export default navSlice.reducer;
