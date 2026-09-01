import { selectBrandNameViewModel } from './brandNameSelectors'

describe('brand ingress', () => {
  it('retains a usable registry anchor without authored brand data', () => {
    expect(selectBrandNameViewModel('', false)).toEqual({
      brandName: '',
      accessibilityLabel: 'Ingress',
      isLoading: false,
      visible: true,
    })
  })
})
