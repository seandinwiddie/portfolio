export type BrandNameViewProps = {
  readonly brandName: string
  readonly accessibilityLabel: string
  readonly isLoading: boolean
}

export const selectBrandNameViewModel = (
  brandName: string,
  isLoading: boolean
): BrandNameViewProps => ({
  brandName,
  accessibilityLabel: `${brandName} — home`,
  isLoading,
})
