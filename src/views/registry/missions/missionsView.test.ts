import React from 'react'
import { selectActivityLabel } from '../../../features/systems/registry/missions/operations/copy/copySelectors'
import { TEST_INITIAL_STATE } from '../../../test/apiPayload.test.data'
import { renderWithProviders } from '../../../test/providers.test.helper'
import Missions from './missionsView'

describe('activityLabel', () => {
  it.each([
    ['push', 1, 'push'],
    ['push', 2, 'pushes'],
    ['issue', 2, 'issues'],
    ['pull_request', 2, 'pull requests'],
    ['comment', 2, 'comments'],
  ])('inflects %s at %i as %s', (kind, count, expected) => {
    expect(
      selectActivityLabel(TEST_INITIAL_STATE.presentation.missions.copy)(kind, count)
    ).toBe(expected)
  })
})

describe('Missions failure state', () => {
  it('renders the neutral API notice when authored presentation is unavailable', () => {
    const { getByText } = renderWithProviders(
      React.createElement(Missions, {
        dataStatus: { pendingLabel: null, errorLabel: 'Registry data unavailable.' },
        available: false,
        eyebrow: '',
        headline: '',
        statement: '',
        loadingLabel: '',
        errorLabel: '',
        isLoading: false,
        isError: true,
        degradedMessage: null,
        data: null,
      })
    )

    expect(getByText('Registry data unavailable.')).toBeTruthy()
  })
})
