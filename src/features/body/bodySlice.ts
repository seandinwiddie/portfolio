import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';

interface BodyState {
  description: string;
}

const bodySlice = createSlice({
  name: 'body',
  initialState: {} as BodyState,
  reducers: {
    setDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      api.endpoints.getAppData.matchFulfilled,
      (state, { payload }) => {
        state.description = payload.description;
      }
    );
  },
});

export const { setDescription } = bodySlice.actions;
export default bodySlice.reducer;
