export type OverlayMatrixId = 'appearance' | 'archive'

export type OverlayMatrixState = Readonly<{
  active: OverlayMatrixId | null
}>
