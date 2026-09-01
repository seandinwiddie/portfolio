export type SignalActivityId =
  | 'query-sync'
  | 'query-resolve'
  | 'route-transit'
  | 'query-fault'

export type SignalActivityKind = 'sync' | 'resolve' | 'transit' | 'fault'

export type SignalActivityWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle'

export type SignalActivityVisualComponent = {
  readonly kind: SignalActivityKind
  readonly durationMs: number
  readonly intensity: number
  readonly x: number
  readonly y: number
  readonly rotation: number
  readonly travelVw: number
  readonly spreadVw: number
}

export type SignalActivityAcousticComponent = {
  readonly frequency: number
  readonly destinationFrequency: number
  readonly filterFrequency: number
  readonly durationSeconds: number
  readonly attackSeconds: number
  readonly delayMs: number
  readonly gain: number
  readonly filterQ: number
  readonly waveform: SignalActivityWaveform
}

export type SignalActivityWorld = {
  readonly ids: readonly SignalActivityId[]
  readonly visuals: Readonly<Record<SignalActivityId, SignalActivityVisualComponent>>
  readonly acoustics: Readonly<Record<SignalActivityId, SignalActivityAcousticComponent>>
}

export type SignalActivityState = {
  readonly activeId: SignalActivityId | null
  readonly sequence: number
}

export type SignalActivityCue = SignalActivityAcousticComponent & {
  readonly id: SignalActivityId
}
