import reducer, {
  initialOverlayMatrixState,
  overlayDismissed,
  overlayRequested,
  overlayToggled,
} from './overlayMatrixSlice'

describe('overlayMatrixSlice', () => {
  it('keeps appearance and archive surfaces mutually exclusive', () => {
    const appearance = reducer(initialOverlayMatrixState, overlayRequested('appearance'))
    const archive = reducer(appearance, overlayRequested('archive'))

    expect(appearance.active).toBe('appearance')
    expect(archive.active).toBe('archive')
  })

  it('only dismisses the requested active surface', () => {
    const archive = reducer(initialOverlayMatrixState, overlayRequested('archive'))

    expect(reducer(archive, overlayDismissed('appearance')).active).toBe('archive')
    expect(reducer(archive, overlayDismissed('archive')).active).toBeNull()
    expect(reducer(archive, overlayToggled('archive')).active).toBeNull()
  })
})
