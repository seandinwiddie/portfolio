import { createSelector } from '@reduxjs/toolkit'
import type { ThemeCustomState } from './themeCustomSlice'
import type { RuntimeThemePresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'

type ThemeCustomRoot = Readonly<{ themeCustom: ThemeCustomState }>

export type ThemeCustomViewProps = Readonly<{
  loadLabel: string
  downloadLabel: string
  feedback: ThemeCustomFeedbackViewModel | null
  onDownload: () => void
  onLoad: () => void
}>

export type ThemeCustomFeedbackViewModel = Readonly<{
  text: string
  className: string
  role: 'status' | 'alert'
  live: 'polite' | 'assertive'
}>

export const selectCustomThemeName = (state: ThemeCustomRoot) =>
  state.themeCustom.customThemeName

export const selectThemeCustomStatus = (state: ThemeCustomRoot) =>
  state.themeCustom.status

export const selectThemeCustomError = (state: ThemeCustomRoot) => state.themeCustom.error

export const selectThemeCustomLoadLabel = (
  state: ThemeCustomRoot,
  presentation: RuntimeThemePresentation | undefined
): string =>
  (selectCustomThemeName(state) === null
    ? presentation?.loadLabel
    : presentation?.updateLabel) ??
  (selectCustomThemeName(state) === null ? 'Load theme' : 'Update theme')

export const selectThemeCustomDownloadLabel = (
  presentation: RuntimeThemePresentation | undefined
): string => presentation?.downloadLabel ?? 'Download theme'

const feedbackSelectors = (presentation: RuntimeThemePresentation | undefined) => ({
  idle: (): ThemeCustomFeedbackViewModel | null => null,
  importing: (): ThemeCustomFeedbackViewModel => ({
    text: presentation?.feedback.importing ?? '',
    className: 'theme-custom-feedback',
    role: 'status',
    live: 'polite',
  }),
  ready: (): ThemeCustomFeedbackViewModel => ({
    text: presentation?.feedback.ready ?? '',
    className: 'theme-custom-feedback theme-custom-feedback-success',
    role: 'status',
    live: 'polite',
  }),
  exporting: (): ThemeCustomFeedbackViewModel => ({
    text: presentation?.feedback.exporting ?? '',
    className: 'theme-custom-feedback',
    role: 'status',
    live: 'polite',
  }),
  failed: (state: ThemeCustomState): ThemeCustomFeedbackViewModel => ({
    text: state.error ?? presentation?.feedback.failed ?? '',
    className: 'theme-custom-feedback theme-custom-feedback-error',
    role: 'alert',
    live: 'assertive',
  }),
})

const selectThemeCustomPresentation = (
  _state: ThemeCustomRoot,
  presentation: RuntimeThemePresentation | undefined
) => presentation

export const selectThemeCustomFeedback = createSelector(
  [(state: ThemeCustomRoot) => state.themeCustom, selectThemeCustomPresentation],
  (themeCustom, presentation): ThemeCustomFeedbackViewModel | null =>
    feedbackSelectors(presentation)[themeCustom.status](themeCustom)
)
