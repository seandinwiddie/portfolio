export type BrandNameViewProps = {
  readonly brandName: string
  readonly accessibilityLabel: string
  readonly isLoading: boolean
  readonly visible: boolean
}

export const selectBrandNameViewModel = (
  brandName: string,
  isLoading: boolean
): BrandNameViewProps => ({
  brandName,
  accessibilityLabel: brandName ? `${brandName} — Ingress` : 'Ingress',
  isLoading,
  visible: true,
})
