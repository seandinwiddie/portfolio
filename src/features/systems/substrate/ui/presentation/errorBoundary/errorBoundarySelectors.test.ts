import { selectErrorBoundaryFallback } from './errorBoundarySelectors'

describe('error-boundary emergency presentation', () => {
  it('retains accessible neutral copy before API presentation is available', () => {
    const fallback = selectErrorBoundaryFallback(undefined)

    expect(fallback.headline).not.toHaveLength(0)
    expect(fallback.message).not.toHaveLength(0)
    expect(fallback.retryLabel).not.toHaveLength(0)
  })
})
