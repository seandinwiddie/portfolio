import { waitFor } from '@testing-library/react-native'
import { selectThemeCustomLoadLabel } from '../../../../entities/bridge/spectrum/themeCustom/themeCustomSelectors'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'
import { customThemeLoaded } from '../../../../entities/bridge/spectrum/themeCustom/themeCustomSlice'
import {
  builtInThemeSelected,
  customThemeSelected,
} from '../../../../entities/bridge/spectrum/themeSelection/themeSelectionSlice'
import { makeStore } from '../../../../../store'

describe('theme selection lifecycle', () => {
  it('clears custom-theme UI state when a built-in theme is selected', async () => {
    const store = makeStore({ autoBatch: false })

    store.dispatch(customThemeLoaded())
    store.dispatch(customThemeSelected('dark'))
    expect(
      selectThemeCustomLoadLabel(store.getState(), TEST_RUNTIME_PRESENTATION.theme)
    ).toBe('Test update')

    store.dispatch(builtInThemeSelected('ruby'))

    await waitFor(() =>
      expect(
        selectThemeCustomLoadLabel(store.getState(), TEST_RUNTIME_PRESENTATION.theme)
      ).toBe('Test load')
    )
  })
})
