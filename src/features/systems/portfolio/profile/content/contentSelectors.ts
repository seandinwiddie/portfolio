import { createSelector } from '@reduxjs/toolkit'
import type { ContentItem } from '../../../../components/platform/foundation/api/apiTypes'
import {
  selectAppProcedures,
  selectPortfolioFeatures,
} from '../../../../entities/portfolio/profile/body/bodySlice'

export interface ContentItemViewModel {
  readonly id: string
  readonly title: string
  readonly description: string
}

export interface ContentSectionViewModel {
  readonly id: string
  readonly heading: string
  readonly emptyLabel: string
  readonly items: readonly ContentItemViewModel[]
}

export interface ContentViewProps {
  readonly sections: readonly ContentSectionViewModel[]
}

export interface PortfolioFeaturesViewProps {
  readonly features: readonly ContentItemViewModel[]
}

const selectItems = (items: readonly ContentItem[]): readonly ContentItemViewModel[] =>
  items.map(({ id, title, description }) => ({ id, title, description }))

export const selectContentViewModelFromItems = (
  portfolioFeatures: readonly ContentItem[],
  appProcedures: readonly ContentItem[]
): ContentViewProps => ({
  sections: [
    {
      id: 'feature',
      heading: 'Portfolio Features',
      emptyLabel: 'No portfolio features available',
      items: selectItems(portfolioFeatures),
    },
    {
      id: 'procedure',
      heading: 'App Procedures',
      emptyLabel: 'No app procedures available',
      items: selectItems(appProcedures),
    },
  ],
})

export const selectContentViewModel = createSelector(
  [selectPortfolioFeatures, selectAppProcedures],
  selectContentViewModelFromItems
)
