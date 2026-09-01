import type {
  ButtonFxCue,
  ButtonFxIdentityProjection,
  ButtonFxInteraction,
  ButtonFxInteractionProfile,
  ButtonFxMechanicalTransient,
  ButtonFxThemeProfile,
} from '../../../../components/bridge/console/buttonFx/buttonFxTypes'
import type { ThemeMode } from '../../../../../styles/themes/themeTypes'

const HASH_SEED = 17
const HASH_MULTIPLIER = 31
const HASH_MODULUS = 104729

const themeProfiles: Readonly<Record<ThemeMode, ButtonFxThemeProfile>> = {
  dark: {
    frequency: 196,
    spread: 86,
    harmonic: 1.5,
    filterFrequency: 1420,
    gain: 0.04,
    waveform: 'triangle',
  },
  dracula: {
    frequency: 233,
    spread: 94,
    harmonic: 1.618,
    filterFrequency: 1760,
    gain: 0.038,
    waveform: 'square',
  },
  light: {
    frequency: 262,
    spread: 72,
    harmonic: 2,
    filterFrequency: 2140,
    gain: 0.025,
    waveform: 'sine',
  },
  mirage: {
    frequency: 220,
    spread: 108,
    harmonic: 1.667,
    filterFrequency: 1880,
    gain: 0.036,
    waveform: 'sawtooth',
  },
  neon: {
    frequency: 294,
    spread: 126,
    harmonic: 2.5,
    filterFrequency: 2640,
    gain: 0.032,
    waveform: 'square',
  },
  ruby: {
    frequency: 174,
    spread: 98,
    harmonic: 2.25,
    filterFrequency: 1560,
    gain: 0.041,
    waveform: 'sawtooth',
  },
  custom: {
    frequency: 247,
    spread: 116,
    harmonic: 1.75,
    filterFrequency: 2280,
    gain: 0.034,
    waveform: 'triangle',
  },
}

const interactionProfiles: Readonly<
  Record<ButtonFxInteraction, ButtonFxInteractionProfile>
> = {
  hover: {
    frequency: 72,
    filterFrequency: 460,
    durationSeconds: 0.052,
    gain: 0.48,
    glide: 1.12,
    mechanicalFrequencyRatio: 0.42,
    mechanicalFilterRatio: 0.46,
    mechanicalDurationSeconds: 0.022,
    mechanicalGain: 0.16,
    mechanicalGlide: 0.68,
    mechanicalWaveform: 'triangle',
  },
  press: {
    frequency: -38,
    filterFrequency: -180,
    durationSeconds: 0.108,
    gain: 1,
    glide: 0.72,
    mechanicalFrequencyRatio: 0.58,
    mechanicalFilterRatio: 0.38,
    mechanicalDurationSeconds: 0.048,
    mechanicalGain: 0.38,
    mechanicalGlide: 1.32,
    mechanicalWaveform: 'square',
  },
}

const normalizeIdentityPart = (value: string | null): string =>
  (value ?? '').trim().replace(/\s+/gu, '-').toLowerCase().slice(0, 96)

const hashButtonFxIdentity = (identity: string): number =>
  Array.from(identity).reduce(
    (hash, character) =>
      (hash * HASH_MULTIPLIER + character.charCodeAt(0)) % HASH_MODULUS,
    HASH_SEED
  )

const identityVariation = (identity: string): number =>
  hashButtonFxIdentity(identity) / HASH_MODULUS

const selectMechanicalTransient =
  (themeProfile: ButtonFxThemeProfile) =>
  (interactionProfile: ButtonFxInteractionProfile) =>
  (variation: number): ButtonFxMechanicalTransient => {
    const frequency =
      themeProfile.frequency * interactionProfile.mechanicalFrequencyRatio +
      variation * 18

    return {
      frequency,
      destinationFrequency: frequency * interactionProfile.mechanicalGlide,
      filterFrequency:
        themeProfile.filterFrequency * interactionProfile.mechanicalFilterRatio +
        variation * themeProfile.spread,
      durationSeconds: interactionProfile.mechanicalDurationSeconds,
      gain: themeProfile.gain * interactionProfile.mechanicalGain,
      waveform: interactionProfile.mechanicalWaveform,
    }
  }

export const selectButtonFxIdentity = (
  projection: ButtonFxIdentityProjection
): string => {
  const semantic = [
    projection.explicitId,
    projection.testId,
    projection.accessibleName,
    projection.href,
    projection.text,
  ]
    .map(normalizeIdentityPart)
    .find(Boolean)
  const tag = normalizeIdentityPart(projection.tag) || 'control'
  const path = normalizeIdentityPart(projection.structuralPath) || 'root'

  return semantic ? `${tag}:${semantic}` : `${tag}:anonymous:${path}`
}

export const selectButtonFxCue =
  (identity: string) =>
  (interaction: ButtonFxInteraction) =>
  (theme: ThemeMode): ButtonFxCue => {
    const themeProfile = themeProfiles[theme]
    const interactionProfile = interactionProfiles[interaction]
    const variation = identityVariation(identity)
    const frequency =
      themeProfile.frequency +
      interactionProfile.frequency +
      variation * themeProfile.spread

    return {
      identity,
      interaction,
      theme,
      frequency,
      destinationFrequency: frequency * interactionProfile.glide,
      overtoneFrequency: frequency * themeProfile.harmonic,
      filterFrequency:
        themeProfile.filterFrequency +
        interactionProfile.filterFrequency +
        variation * themeProfile.spread,
      durationSeconds: interactionProfile.durationSeconds,
      gain: themeProfile.gain * interactionProfile.gain,
      waveform: themeProfile.waveform,
      mechanicalTransient:
        selectMechanicalTransient(themeProfile)(interactionProfile)(variation),
    }
  }
