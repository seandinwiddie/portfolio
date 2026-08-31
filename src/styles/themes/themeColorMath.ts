import type { ContributionRamp } from './themeTypes'

const HEX_CHANNEL_OFFSETS = [1, 3, 5] as const
const MIX_STEPS = Array.from({ length: 101 }, (_, index) => index / 100)

const rgbFrom = (hex: string): readonly number[] =>
  HEX_CHANNEL_OFFSETS.map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))

const channelHex = (channel: number): string =>
  Math.round(channel).toString(16).padStart(2, '0').toUpperCase()

const alphaFrom = (hex: string): number =>
  hex.length === 9 ? Number.parseInt(hex.slice(7, 9), 16) : 255

const hexFrom = (channels: readonly number[]): string =>
  `#${channels.map(channelHex).join('')}`

export const withAlpha = (hex: string, opacity: number): string =>
  `${hex.slice(0, 7)}${channelHex(alphaFrom(hex) * opacity)}`

export const mixHex =
  (source: string, target: string) =>
  (amount: number): string => {
    const targetChannels = rgbFrom(target)
    return hexFrom(
      rgbFrom(source).map(
        (channel, index) => channel + (targetChannels[index] - channel) * amount
      )
    )
  }

const linearChannel = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

export const relativeLuminance = (hex: string): number =>
  rgbFrom(hex)
    .map((channel) => linearChannel(channel / 255))
    .map((channel, index) => channel * [0.2126, 0.7152, 0.0722][index])
    .reduce((luminance, weightedChannel) => luminance + weightedChannel, 0)

export const contrastRatio = (foreground: string, background: string): number => {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)]
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
}

export const deriveContrastColor =
  (backgrounds: readonly string[], threshold: number) =>
  (source: string, toward: string): string => {
    const blend = mixHex(source, toward)
    return (
      MIX_STEPS.map(blend).find((candidate) =>
        backgrounds.every(
          (background) => contrastRatio(candidate, background) >= threshold
        )
      ) ?? toward
    )
  }

export const sequentialRamp = (base: string, peak: string): ContributionRamp => {
  const blend = mixHex(base, peak)
  return [blend(0.08), blend(0.31), blend(0.54), blend(0.77), blend(1)]
}
