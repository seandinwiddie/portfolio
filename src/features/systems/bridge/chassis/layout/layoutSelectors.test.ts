import {
  selectLayoutReady,
  selectLayoutViewModel,
  selectWorkspaceLabel,
} from './layoutSelectors'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'

const presentation = TEST_RUNTIME_PRESENTATION.layout

describe('layout selectors', () => {
  it('names every known workspace and keeps unknown routes inside the bridge', () => {
    expect(selectWorkspaceLabel('/', presentation)).toBe('Test ingress workspace')
    expect(selectWorkspaceLabel('/missions', presentation)).toBe(
      'Test missions workspace'
    )
    expect(selectWorkspaceLabel('/missing', presentation)).toBe('Test missing workspace')
  })

  it('projects the selected surface without hiding navigation at entry', () => {
    expect(selectLayoutViewModel('dark', '/')(presentation).statusBarStyle).toBe(
      'light-content'
    )
    expect(selectLayoutViewModel('light', '/dossier')(presentation).workspaceLabel).toBe(
      'Test dossier workspace'
    )
  })

  it('keeps the skip target and workspace accessibly named without /data', () => {
    const model = selectLayoutViewModel('dark', '/')(undefined)

    expect(model.skipLabel).not.toHaveLength(0)
    expect(model.workspaceLabel).not.toHaveLength(0)
  })

  it('keeps the native splash until fonts and theme restoration are coherent', () => {
    expect(
      selectLayoutReady({ fontsLoaded: true, fontError: null, themeReady: false })
    ).toBe(false)
    expect(
      selectLayoutReady({
        fontsLoaded: false,
        fontError: new Error('font unavailable'),
        themeReady: true,
      })
    ).toBe(true)
    expect(
      selectLayoutReady({ fontsLoaded: true, fontError: null, themeReady: true })
    ).toBe(true)
  })
})
