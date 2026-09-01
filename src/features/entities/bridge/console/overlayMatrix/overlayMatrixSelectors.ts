import type {
  OverlayMatrixId,
  OverlayMatrixState,
} from '../../../../components/bridge/console/overlayMatrix/overlayMatrixTypes'

type OverlayMatrixRoot = Readonly<{ overlayMatrix: OverlayMatrixState }>

export const selectOverlayActive =
  (id: OverlayMatrixId) =>
  (state: OverlayMatrixRoot): boolean =>
    state.overlayMatrix.active === id
