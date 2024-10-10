import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';

interface NavState {
  brandName: string;
}

const navSlice = createSlice({
  name: 'nav',
  initialState: {} as NavState,
  reducers: {
    setBrandName: (state, action: PayloadAction<string>) => {
      state.brandName = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        state.brandName = payload.brandName;
      }
    );
  },
});

export const { setBrandName } = navSlice.actions;
export default navSlice.reducer;
