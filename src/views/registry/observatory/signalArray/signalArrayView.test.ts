import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import type {
  ObservatoryChartViewModel,
  ObservatoryEstateViewModel,
  ObservatoryViewProps,
} from '../../../../features/systems/registry/observatory/signalArray/signalArraySelectors'
import { renderWithProviders } from '../../../../test/providers.test.helper'
import Observatory from './signalArrayView'

const viewSource = readFileSync(
  join(
    process.cwd(),
    'src',
    'views',
    'registry',
    'observatory',
    'signalArray',
    'signalArrayView.tsx'
  ),
  'utf8'
)

const emptyChart = (id: string): ObservatoryChartViewModel => ({
  id,
  label: 'Test chart',
  accessibilityLabel: 'Test empty chart',
  path: '',
  areaPath: '',
  points: [],
  stroke: '#fff',
  fill: '#fff',
  axisInk: '#fff',
  empty: true,
})

const estate: ObservatoryEstateViewModel = {
  id: 'forboc',
  label: 'Forboc.ai',
  url: 'https://forboc.ai',
  window: 'Test window · 2026-08-03 — 2026-08-30',
  instrumented: false,
  availabilityLabel: 'OPERATIONAL',
  tone: 'positive',
  presence: {
    label: 'Test presence',
    availability: 'operational',
    state: 'OPERATIONAL',
    checkedAt: '2026-08-31T20:00:00.000Z',
    observed: 'Test observed Aug 31',
    latency: '42 ms',
    httpStatus: 'HTTP 200',
    tone: 'positive',
  },
  repositoriesLabel: 'Test public systems',
  repositories: [
    {
      id: 'seandinwiddie-portfolio',
      label: 'seandinwiddie-portfolio',
      url: 'https://github.com/seandinwiddie/portfolio',
      status: 'public-source',
      statusLabel: 'PUBLIC SOURCE',
    },
  ],
  live: null,
  analytics: {
    label: 'Test audience',
    availability: 'not-instrumented',
    availabilityLabel: 'NOT INSTRUMENTED',
    tone: 'neutral',
    metrics: [],
    chart: emptyChart('forboc-audience'),
  },
  discovery: {
    label: 'Test discovery',
    availability: 'not-instrumented',
    availabilityLabel: 'NOT INSTRUMENTED',
    tone: 'neutral',
    metrics: [],
    chart: emptyChart('forboc-discovery'),
  },
  baselineRecorded: false,
  baselineLabel: 'Test baseline',
}

const props: ObservatoryViewProps = {
  dataStatus: { pendingLabel: null, errorLabel: null },
  visible: true,
  eyebrow: 'Test signal array',
  headline: 'Test observatory',
  statement: 'Test aggregate statement',
  impactLabel: 'Test impact',
  presenceLabel: 'Test presence',
  window: 'Test window',
  observed: 'Test observed',
  feedLabel: 'Test available',
  feedTone: 'positive',
  impact: [],
  impactState: null,
  estates: [estate],
  presence: [],
  presenceState: null,
}

describe('Observatory estate view', () => {
  it('exposes deterministic semantic estate and capability evidence', () => {
    const { getAllByText, getByTestId } = renderWithProviders(
      React.createElement(Observatory, props)
    )
    const section = getByTestId('estate-forboc')
    const links = section.findAllByProps({ accessibilityRole: 'link' })
    const repository = getByTestId('estate-repository-seandinwiddie-portfolio')

    expect(section.props['aria-labelledby']).toBe('estate-forboc-heading')
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(repository).toBeTruthy()
    expect(getAllByText('Test observed Aug 31')).toHaveLength(1)
    expect(getAllByText('PUBLIC SOURCE')).toHaveLength(1)
    expect(getAllByText('NOT INSTRUMENTED')).toHaveLength(2)
  })

  it('keeps the web agent dataset keys stable', () => {
    expect(viewSource).toContain('estateId: id')
    expect(viewSource).toContain('presenceStatus: presence.availability')
    expect(viewSource).toContain('analyticsStatus: analytics.availability')
    expect(viewSource).toContain('searchConsoleStatus: discovery.availability')
    expect(viewSource).toContain("sourceEndpoint: '/observatory'")
    expect(viewSource).toContain('observationPeriod: window')
    expect(viewSource).toContain('repositoryStatus: status')
    expect(viewSource.match(/href=\{url\}/gu)).toHaveLength(2)
  })
})
