import { selectApiDocumentStatus } from './apiSelectors'

describe('API document status', () => {
  it('projects an uninitialized server render as pending rather than failed', () => {
    expect(
      selectApiDocumentStatus(false, {
        isLoading: false,
        isError: false,
        isUninitialized: true,
      })
    ).toEqual({
      pendingLabel: 'Synchronizing registry data…',
      errorLabel: null,
      staleLabel: null,
    })
  })

  it('projects an initialized empty failure state honestly', () => {
    expect(
      selectApiDocumentStatus(false, {
        isLoading: false,
        isError: true,
        isUninitialized: false,
      })
    ).toEqual({
      pendingLabel: null,
      errorLabel: 'Registry data unavailable.',
      staleLabel: null,
    })
  })

  it('projects retained data after a failed refresh as stale API-owned copy', () => {
    expect(
      selectApiDocumentStatus(true, {
        isLoading: false,
        isError: true,
        isUninitialized: false,
        staleLabel: 'Test stale registry signal',
      })
    ).toEqual({
      pendingLabel: null,
      errorLabel: null,
      staleLabel: 'Test stale registry signal',
    })
  })
})
