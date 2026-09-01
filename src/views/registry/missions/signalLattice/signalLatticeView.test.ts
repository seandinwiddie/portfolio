import React from 'react'
import type { Contributions } from '../../../../features/components/substrate/kernel/api/apiTypes'
import {
  MAX_CONTRIBUTION_DAYS,
  selectSignalLatticeViewModel,
} from '../../../../features/systems/registry/missions/operations/signalLattice/signalLatticeSelectors'
import type { ThemeVisualization } from '../../../../styles/themes/themeTypes'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import SignalLattice from './signalLatticeView'
import { TEST_RUNTIME_PRESENTATION } from '../../../../test/runtimePresentation.test.data'

const contributions: Contributions = {
  days: [
    { date: '2026-08-29', count: 0, level: 0 },
    { date: '2026-08-30', count: 4, level: 2 },
  ],
  total: 4,
  source: 'html',
}

const darkVisualization: ThemeVisualization = {
  contributionRamp: ['#111111', '#122222', '#133333', '#144444', '#155555'],
  axisInk: '#aaaaaa',
}

const neonVisualization: ThemeVisualization = {
  contributionRamp: ['#210021', '#420042', '#630063', '#840084', '#a500a5'],
  axisInk: '#ff99ff',
}

describe('SignalLattice', () => {
  it('renders cell fills from the active theme visualization', () => {
    const darkModel = selectSignalLatticeViewModel(
      contributions,
      darkVisualization
    )(TEST_RUNTIME_PRESENTATION.signalLattice)
    const neonModel = selectSignalLatticeViewModel(
      contributions,
      neonVisualization
    )(TEST_RUNTIME_PRESENTATION.signalLattice)
    const dark = renderWithProviders(React.createElement(SignalLattice, darkModel))
    const darkFill = dark.getByTestId('contribution-cell-2026-08-30').props.fill
    dark.unmount()

    const neon = renderWithProviders(React.createElement(SignalLattice, neonModel))
    const neonFill = neon.getByTestId('contribution-cell-2026-08-30').props.fill

    expect(darkModel.cells[0]?.fill).toBe('#111111')
    expect(neonModel.cells[0]?.fill).toBe('#210021')
    expect(darkModel.cells[1]?.fill).toBe('#133333')
    expect(neonModel.cells[1]?.fill).toBe('#630063')
    expect(darkModel.monthTicks[0]?.fill).toBe('#aaaaaa')
    expect(neonModel.monthTicks[0]?.fill).toBe('#ff99ff')
    expect(neonFill).not.toEqual(darkFill)
  })

  it('retains only the newest chronological 372 cells from malformed payloads', () => {
    const days = Array.from({ length: MAX_CONTRIBUTION_DAYS + 2 }, (_, index) => ({
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      count: 1,
      level: 1,
    }))
    const model = selectSignalLatticeViewModel(
      { days: days.toReversed(), total: days.length, source: 'html' },
      darkVisualization
    )(TEST_RUNTIME_PRESENTATION.signalLattice)

    expect(model.cells).toHaveLength(MAX_CONTRIBUTION_DAYS)
    expect(model.cells[0]?.id).toBe(days[2]?.date)
    expect(model.cells.at(-1)?.id).toBe(days.at(-1)?.date)
  })
})
