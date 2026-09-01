import React from 'react'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import UnitPlate from './unitPlateView'

describe('UnitPlate', () => {
  it('renders its scan as a real child without replacing panel brackets', () => {
    const { getByTestId, getByText } = renderWithProviders(
      React.createElement(UnitPlate, {
        visible: true,
        heading: 'Test unit record',
        status: 'Test operational',
        rows: [{ id: 'designation', label: 'designation', value: 'TEST UNIT' }],
      })
    )

    expect(
      getByTestId('unit-plate-scan-beam', { includeHiddenElements: true })
    ).toBeTruthy()
    expect(getByText('TEST UNIT')).toBeTruthy()
  })
})
