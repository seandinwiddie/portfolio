import type { About, ContentItem } from '../../../platform/foundation/api/apiTypes'

export type BodyDataSource = 'network' | 'pending' | 'error'

export interface BodyState {
  readonly portfolioFeatures: ContentItem[]
  readonly appProcedures: ContentItem[]
  readonly brandName: string
  readonly description: string
  readonly brandNameLoading: { readonly isLoading: boolean }
  readonly source: BodyDataSource
  readonly about: About | null
}
