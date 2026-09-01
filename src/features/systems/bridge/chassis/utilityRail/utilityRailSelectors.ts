import type { UtilityRailPresentation } from '../../../../components/substrate/kernel/api/apiTypes'

export interface UtilityRailLinkViewModel {
  readonly id: string
  readonly url: string
  readonly label: string
}

export interface UtilityRailViewProps {
  readonly links: readonly UtilityRailLinkViewModel[]
}

export const selectUtilityRailViewModel = (
  presentation: UtilityRailPresentation | undefined
): UtilityRailViewProps => ({
  links: presentation?.links.map(({ id, url, label }) => ({ id, url, label })) ?? [],
})
