import {
  selectThemeCustomFeedback,
  selectThemeCustomDownloadLabel,
  selectThemeCustomLoadLabel,
} from './themeCustomSelectors'
import type { ThemeCustomState } from './themeCustomSlice'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'

const presentation = TEST_RUNTIME_PRESENTATION.theme

const stateWith = (status: ThemeCustomState['status'], error: string | null = null) => ({
  themeCustom: {
    customThemeName: status === 'ready' ? ('custom' as const) : null,
    status,
    error,
  },
})

describe('theme custom selectors', () => {
  it('projects progress, success, and failure feedback for the control view', () => {
    expect(selectThemeCustomFeedback(stateWith('importing'), presentation)?.text).toBe(
      'Test importing'
    )
    expect(selectThemeCustomFeedback(stateWith('ready'), presentation)?.text).toBe(
      'Test ready'
    )
    expect(
      selectThemeCustomFeedback(stateWith('failed', 'Unsafe theme'), presentation)
    ).toMatchObject({ text: 'Unsafe theme', role: 'alert', live: 'assertive' })
  })

  it('returns to the Load label and clears feedback after leaving custom mode', () => {
    expect(selectThemeCustomLoadLabel(stateWith('idle'), presentation)).toBe('Test load')
    expect(selectThemeCustomFeedback(stateWith('idle'), presentation)).toBeNull()
  })

  it('keeps import and export controls named before /data arrives', () => {
    expect(selectThemeCustomLoadLabel(stateWith('idle'), undefined)).not.toHaveLength(0)
    expect(selectThemeCustomDownloadLabel(undefined)).not.toHaveLength(0)
  })

  it('retains feedback projection identity across unrelated dispatch state', () => {
    const state = stateWith('ready')

    expect(selectThemeCustomFeedback(state, presentation)).toBe(
      selectThemeCustomFeedback({ ...state }, presentation)
    )
  })
})
