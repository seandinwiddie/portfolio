import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import ArchiveControl from './archiveControlView'
import { useGetGithubSummaryQuery } from '../../../../features/systems/substrate/kernel/api/apiApi'
import { useArchiveControlComposition } from '../../../../features/systems/bridge/console/archiveControl/archiveControlThunks'
import type { GithubSummary } from '../../../../features/components/substrate/kernel/api/apiTypes'
import { renderWithProviders } from '../../../../test/providers.test.helper'

jest.mock('../../../../features/systems/substrate/kernel/api/apiApi', () => ({
  ...jest.requireActual('../../../../features/systems/substrate/kernel/api/apiApi'),
  useGetGithubSummaryQuery: jest.fn(),
}))

const summary: GithubSummary = {
  profile: {
    login: 'SEANDINWIDDIE',
    name: 'Sean Dinwiddie',
    bio: null,
    location: null,
    blog: null,
    avatarUrl: 'https://example.com/avatar.png',
    htmlUrl: 'https://github.com/SEANDINWIDDIE',
    publicRepos: 1,
    followers: 1,
  },
  repos: [
    {
      id: '1',
      name: 'portfolio',
      fullName: 'SEANDINWIDDIE/portfolio',
      owner: 'SEANDINWIDDIE',
      description: 'Portfolio',
      language: 'TypeScript',
      stars: 0,
      forks: 0,
      topics: [],
      createdAt: '2026-08-01T00:00:00Z',
      htmlUrl: 'https://github.com/SEANDINWIDDIE/portfolio',
      homepage: 'https://sdin.dev',
      pushedAt: '2026-08-30T12:00:00Z',
    },
  ],
  languages: [{ language: 'TypeScript', count: 1 }],
  owners: [{ owner: 'SEANDINWIDDIE', count: 1 }],
  since: '2026-08-01T00:00:00Z',
  activity: {
    events: [],
    byRepo: [],
    byKind: [],
    total: 0,
    since: null,
    until: null,
  },
  contributions: null,
  commits: {
    commits: [
      {
        sha: 'abc1234',
        repo: 'SEANDINWIDDIE/portfolio',
        at: '2026-08-30T12:00:00Z',
        url: 'https://github.com/SEANDINWIDDIE/portfolio/commit/abc1234',
        type: 'fix',
        scope: 'console',
        summary: 'keep command focus',
        subject: 'fix(console): keep command focus',
      },
    ],
    total: 1,
    byType: [{ type: 'fix', count: 1 }],
  },
  cached: false,
  authenticated: true,
}

const mockSummaryQuery = useGetGithubSummaryQuery as jest.Mock

const ArchiveHarness = () =>
  React.createElement(ArchiveControl, useArchiveControlComposition())

describe('ArchiveControl', () => {
  beforeEach(() => {
    mockSummaryQuery.mockReturnValue({ data: summary, status: 'fulfilled' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('keeps a real trigger available at every viewport size', () => {
    const { getByTestId } = renderWithProviders(React.createElement(ArchiveHarness))
    const trigger = getByTestId('archive-control-trigger')

    expect(trigger.props.accessibilityRole).toBe('button')
    expect(trigger.props.accessibilityLabel).toBe('Open Archive Control')
    expect(trigger.props['aria-keyshortcuts']).toBe('Control+K Meta+K `')
  })

  it('opens to a focus-preserving input and an accessible close button', () => {
    const { getByTestId } = renderWithProviders(React.createElement(ArchiveHarness))
    fireEvent.press(getByTestId('archive-control-trigger'))

    expect(getByTestId('archive-control-input').props.blurOnSubmit).toBe(false)
    expect(getByTestId('archive-control-close').props.accessibilityRole).toBe('button')
  })

  it('closes when Escape originates from the focused input', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      React.createElement(ArchiveHarness)
    )
    fireEvent.press(getByTestId('archive-control-trigger'))

    fireEvent(getByTestId('archive-control-input'), 'keyPress', {
      nativeEvent: { key: 'Escape' },
    })

    expect(queryByTestId('archive-control-input')).toBeNull()
    expect(getByTestId('archive-control-trigger')).toBeTruthy()
  })

  it('renders commit data through the command dispatch table', () => {
    const { getByTestId, getByText } = renderWithProviders(
      React.createElement(ArchiveHarness)
    )
    fireEvent.press(getByTestId('archive-control-trigger'))
    const input = getByTestId('archive-control-input')

    fireEvent.changeText(input, 'commits')
    fireEvent(input, 'submitEditing')

    expect(
      getByText(/abc1234 SEANDINWIDDIE\/portfolio\s+fix\(console\): keep command focus/)
    ).toBeTruthy()
    expect(getByTestId('archive-control-input').props.blurOnSubmit).toBe(false)
  })
})
