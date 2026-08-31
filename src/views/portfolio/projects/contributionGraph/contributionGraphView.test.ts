import React from 'react'
import type { Contributions } from '../../../../features/components/platform/foundation/api/apiTypes'
import { selectContributionGraphViewModel } from '../../../../features/systems/portfolio/projects/projects/contributionGraph/contributionGraphSelectors'
import type { ThemeVisualization } from '../../../../styles/themes/themeTypes'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import ContributionGraph from './contributionGraphView'

const contributions: Contributions = {
  days: [
    { date: '2026-08-29', count: 0, level: 0 },
    { date: '2026-08-30', count: 4, level: 2 },
  ],
  total: 4,
  source: 'graphql',
}

const darkVisualization: ThemeVisualization = {
  contributionRamp: ['#111111', '#122222', '#133333', '#144444', '#155555'],
  axisInk: '#aaaaaa',
}

const neonVisualization: ThemeVisualization = {
  contributionRamp: ['#210021', '#420042', '#630063', '#840084', '#a500a5'],
  axisInk: '#ff99ff',
}

describe('ContributionGraph', () => {
  it('renders cell fills from the active theme visualization', () => {
    const darkModel = selectContributionGraphViewModel(contributions, darkVisualization)
    const neonModel = selectContributionGraphViewModel(contributions, neonVisualization)
    const dark = renderWithProviders(React.createElement(ContributionGraph, darkModel))
    const darkFill = dark.getByTestId('contribution-cell-2026-08-30').props.fill
    dark.unmount()

    const neon = renderWithProviders(React.createElement(ContributionGraph, neonModel))
    const neonFill = neon.getByTestId('contribution-cell-2026-08-30').props.fill

    expect(darkModel.cells[0]?.fill).toBe('#111111')
    expect(neonModel.cells[0]?.fill).toBe('#210021')
    expect(darkModel.cells[1]?.fill).toBe('#133333')
    expect(neonModel.cells[1]?.fill).toBe('#630063')
    expect(darkModel.monthTicks[0]?.fill).toBe('#aaaaaa')
    expect(neonModel.monthTicks[0]?.fill).toBe('#ff99ff')
    expect(neonFill).not.toEqual(darkFill)
  })
})
