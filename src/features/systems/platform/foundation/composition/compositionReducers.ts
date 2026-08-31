import ambientSceneReducer from '../../../../entities/shell/frame/ambientScene/ambientSceneSlice'
import bodyReducer from '../../../../entities/portfolio/profile/body/bodySlice'
import brandNameReducer from '../../../../entities/shell/frame/brandName/brandNameSlice'
import diagnosticsReducer from '../../../../entities/platform/observability/diagnostics/diagnosticsSlice'
import experienceReducer from '../../../../entities/shell/controls/experience/experienceSlice'
import navigationReducer from '../../../../entities/shell/frame/navigation/navigationSlice'
import themeCustomReducer from '../../../../entities/shell/themes/themeCustom/themeCustomSlice'
import themeSelectionReducer from '../../../../entities/shell/themes/themeSelection/themeSelectionSlice'

export const compositionReducers = {
  ambientScene: ambientSceneReducer,
  themeSelection: themeSelectionReducer,
  themeCustom: themeCustomReducer,
  brandName: brandNameReducer,
  diagnostics: diagnosticsReducer,
  nav: navigationReducer,
  body: bodyReducer,
  experience: experienceReducer,
}
