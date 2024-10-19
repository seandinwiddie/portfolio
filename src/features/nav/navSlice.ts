import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';

interface NavState {
  brandName: string;
}

const initialState: NavState = {
  brandName: '',
};

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
      apiSlice.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        state.brandName = payload.brandName;
      }
    );
  },
});

export const { setBrandName } = navSlice.actions;
export default navSlice.reducer;
