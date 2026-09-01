import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import SoundPreference from './soundPreferenceView'

describe('SoundPreference', () => {
  it('renders the prepared API copy and reports a visitor toggle', () => {
    const onToggle = jest.fn()
    const { getByTestId, getByText } = renderWithProviders(
      React.createElement(SoundPreference, {
        enabled: true,
        ready: true,
        text: 'Test sound on',
        label: 'Test disable sound',
        onToggle,
      })
    )

    expect(getByText('Test sound on')).toBeTruthy()
    fireEvent.press(getByTestId('sound-preference-toggle'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('withholds an unnamed control until restoration and API copy are ready', () => {
    const { queryByTestId } = renderWithProviders(
      React.createElement(SoundPreference, {
        enabled: true,
        ready: false,
        text: '',
        label: '',
        onToggle: jest.fn(),
      })
    )

    expect(queryByTestId('sound-preference-toggle')).toBeNull()
  })
})
