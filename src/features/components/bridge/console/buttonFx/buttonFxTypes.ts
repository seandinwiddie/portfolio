import type { ThemeMode } from '../../../../../styles/themes/themeTypes'

export const BUTTON_FX_INTERACTIONS = ['hover', 'press'] as const

export type ButtonFxInteraction = (typeof BUTTON_FX_INTERACTIONS)[number]

export type ButtonFxEvent = Readonly<{
  identity: string
}>

export type ButtonFxIdentityProjection = Readonly<{
  tag: string
  explicitId: string | null
  testId: string | null
  accessibleName: string | null
  href: string | null
  text: string | null
  structuralPath: string
}>

export type ButtonFxWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle'

export type ButtonFxMechanicalTransient = Readonly<{
  frequency: number
  destinationFrequency: number
  filterFrequency: number
  durationSeconds: number
  gain: number
  waveform: ButtonFxWaveform
}>

export type ButtonFxCue = Readonly<{
  identity: string
  interaction: ButtonFxInteraction
  theme: ThemeMode
  frequency: number
  destinationFrequency: number
  overtoneFrequency: number
  filterFrequency: number
  durationSeconds: number
  gain: number
  waveform: ButtonFxWaveform
  mechanicalTransient: ButtonFxMechanicalTransient
}>

export type ButtonFxThemeProfile = Readonly<{
  frequency: number
  spread: number
  harmonic: number
  filterFrequency: number
  gain: number
  waveform: ButtonFxWaveform
}>

export type ButtonFxInteractionProfile = Readonly<{
  frequency: number
  filterFrequency: number
  durationSeconds: number
  gain: number
  glide: number
  mechanicalFrequencyRatio: number
  mechanicalFilterRatio: number
  mechanicalDurationSeconds: number
  mechanicalGain: number
  mechanicalGlide: number
  mechanicalWaveform: ButtonFxWaveform
}>

export type ButtonFxAnnouncements = Readonly<{
  hover: (identity: string) => void
  press: (identity: string) => void
}>
