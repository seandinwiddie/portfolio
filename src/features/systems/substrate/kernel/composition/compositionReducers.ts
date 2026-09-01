import diagnosticsReducer from '../../../../entities/substrate/observability/diagnostics/diagnosticsSlice'
import overlayMatrixReducer from '../../../../entities/bridge/console/overlayMatrix/overlayMatrixSlice'
import themeCustomReducer from '../../../../entities/bridge/spectrum/themeCustom/themeCustomSlice'
import themeSelectionReducer from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSlice'

export const compositionReducers = {
  overlayMatrix: overlayMatrixReducer,
  themeSelection: themeSelectionReducer,
  themeCustom: themeCustomReducer,
  diagnostics: diagnosticsReducer,
}
