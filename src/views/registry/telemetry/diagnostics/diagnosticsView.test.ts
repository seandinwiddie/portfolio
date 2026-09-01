import React from 'react'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import Telemetry from './diagnosticsView'

describe('Telemetry failure state', () => {
  it('renders only the neutral API notice when authored presentation is unavailable', () => {
    const { getByText, queryByText } = renderWithProviders(
      React.createElement(Telemetry, {
        dataStatus: { pendingLabel: null, errorLabel: 'Registry data unavailable.' },
        eyebrow: 'Hidden eyebrow',
        statement: 'Hidden statement',
        panels: { uplink: '', payload: '', theme: '', runtime: '' },
        latencyUnit: '',
        emptyLabel: '',
        allNominal: false,
        overallGlyph: '',
        overallHeadline: 'Hidden telemetry deck',
        uplink: { meter: '', latency: '', bars: [], rows: [] },
        payload: { meter: '', rows: [], empty: true },
        theme: { meter: '', rows: [], source: null, sourceLabel: '' },
        runtime: { meter: '', rowsBeforeSeparator: [], rowsAfterSeparator: [] },
      })
    )

    expect(getByText('Registry data unavailable.')).toBeTruthy()
    expect(queryByText('Hidden telemetry deck')).toBeNull()
  })
})
