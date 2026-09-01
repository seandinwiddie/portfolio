import React from 'react'
import { selectRecordsViewModel } from '../../../../features/systems/registry/dossier/records/recordsSelectors'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import Records from './recordsView'
import { TEST_RUNTIME_PRESENTATION } from '../../../../test/runtimePresentation.test.data'

describe('Records', () => {
  it('renders registry capabilities and operating protocols', () => {
    const model = selectRecordsViewModel(
      [{ id: '1', title: 'Feature 1', description: 'Description 1' }],
      [{ id: '1', title: 'Procedure 1', description: 'Description 1' }]
    )(TEST_RUNTIME_PRESENTATION.dossier)
    const { getByText } = renderWithProviders(React.createElement(Records, model))

    expect(getByText('Test capabilities')).toBeTruthy()
    expect(getByText('Feature 1')).toBeTruthy()
    expect(getByText('Test protocols')).toBeTruthy()
    expect(getByText('Procedure 1')).toBeTruthy()
  })

  it('renders empty-state copy when no content is available', () => {
    const model = selectRecordsViewModel([], [])(TEST_RUNTIME_PRESENTATION.dossier)
    const { getByText } = renderWithProviders(React.createElement(Records, model))

    expect(getByText('Test no capabilities')).toBeTruthy()
    expect(getByText('Test no protocols')).toBeTruthy()
  })
})
