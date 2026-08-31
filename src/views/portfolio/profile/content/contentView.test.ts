import React from 'react'
import { selectContentViewModelFromItems } from '../../../../features/systems/portfolio/profile/content/contentSelectors'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import Content from './contentView'

describe('Content', () => {
  it('renders portfolio features and app procedures', () => {
    const model = selectContentViewModelFromItems(
      [{ id: '1', title: 'Feature 1', description: 'Description 1' }],
      [{ id: '1', title: 'Procedure 1', description: 'Description 1' }]
    )
    const { getByText } = renderWithProviders(React.createElement(Content, model))

    expect(getByText('Portfolio Features')).toBeTruthy()
    expect(getByText('Feature 1')).toBeTruthy()
    expect(getByText('App Procedures')).toBeTruthy()
    expect(getByText('Procedure 1')).toBeTruthy()
  })

  it('renders empty-state copy when no content is available', () => {
    const model = selectContentViewModelFromItems([], [])
    const { getByText } = renderWithProviders(React.createElement(Content, model))

    expect(getByText('No portfolio features available')).toBeTruthy()
    expect(getByText('No app procedures available')).toBeTruthy()
  })
})
