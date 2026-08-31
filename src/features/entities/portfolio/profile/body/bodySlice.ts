import { createSlice } from '@reduxjs/toolkit'
import type { BodyState } from '../../../../components/portfolio/profile/body/bodyTypes'
import {
  bodyDataReceived,
  bodyDataRequestFailed,
  bodyDataRequestStarted,
} from './bodyActions'

const initialState: BodyState = {
  portfolioFeatures: [],
  appProcedures: [],
  brandName: '',
  description: '',
  brandNameLoading: { isLoading: true },
  source: 'pending',
  about: null,
}

const bodySlice = createSlice({
  name: 'body',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bodyDataRequestStarted, (state) => {
        state.source = 'pending'
      })
      .addCase(bodyDataReceived, (state, { payload }) => {
        state.portfolioFeatures = payload.portfolioFeatures
        state.appProcedures = payload.appProcedures
        state.brandName = payload.brandName
        state.description = payload.description
        state.brandNameLoading = payload.brandNameLoading
        state.source = payload.source
        state.about = payload.about
      })
      .addCase(bodyDataRequestFailed, (state) => {
        state.source = 'error'
      })
  },
  selectors: {
    selectPortfolioFeatures: (state) => state.portfolioFeatures,
    selectAppProcedures: (state) => state.appProcedures,
    selectDescription: (state) => state.description,
    selectDataSource: (state) => state.source,
    selectAbout: (state) => state.about,
  },
})

export const {
  selectPortfolioFeatures,
  selectAppProcedures,
  selectDescription,
  selectDataSource,
  selectAbout,
} = bodySlice.selectors

export default bodySlice.reducer
