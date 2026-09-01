import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import ThemeToggle from './themeToggleView'

describe('ThemeToggle', () => {
  it('renders prepared theme state and reports a press to its controller', () => {
    const onCycle = jest.fn()

    const { getByTestId, getByText } = renderWithProviders(
      React.createElement(ThemeToggle, {
        prefixLabel: 'Theme:',
        label: 'Ayu Light',
        onCycle,
      })
    )

    expect(getByText('Ayu Light')).toBeTruthy()
    fireEvent.press(getByTestId('theme-toggle'))

    expect(onCycle).toHaveBeenCalledTimes(1)
  })

  it('renders the explicit custom label without deriving mode in the leaf', () => {
    const { getByText } = renderWithProviders(
      React.createElement(ThemeToggle, {
        prefixLabel: 'Theme:',
        label: 'Custom',
        onCycle: jest.fn(),
      })
    )

    expect(getByText('Custom')).toBeTruthy()
  })
})
