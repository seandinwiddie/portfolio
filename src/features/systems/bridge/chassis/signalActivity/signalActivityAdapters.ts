import { fromNullable, match } from 'functional-programming-composition'
import type { SignalActivityCue } from '../../../../components/bridge/chassis/signalActivity/signalActivityTypes'
import { readArmedAudioContext } from '../../console/buttonFx/buttonFxAdapters'

const SILENCE = 0.0001
const MAX_ACTIVE_CUES = 2
let activeCueCount = 0

const reserveCue = (): boolean => {
  const admitted = activeCueCount < MAX_ACTIVE_CUES
  if (admitted) activeCueCount += 1
  return admitted
}

const releaseCue = (): void => {
  activeCueCount = Math.max(0, activeCueCount - 1)
}

/** Web Audio scheduling is the imperative edge for API-authored activity cues. */
export const scheduleSignalActivityCue = (
  context: AudioContext,
  cue: SignalActivityCue
): void => {
  if (!reserveCue()) return

  const start = context.currentTime + cue.delayMs / 1000
  const stop = start + cue.durationSeconds
  const oscillator = context.createOscillator()
  const filter = context.createBiquadFilter()
  const envelope = context.createGain()

  oscillator.type = cue.waveform
  oscillator.frequency.setValueAtTime(cue.frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(cue.destinationFrequency, stop)
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(cue.filterFrequency, start)
  filter.Q.setValueAtTime(cue.filterQ, start)
  envelope.gain.setValueAtTime(SILENCE, start)
  envelope.gain.exponentialRampToValueAtTime(cue.gain, start + cue.attackSeconds)
  envelope.gain.exponentialRampToValueAtTime(SILENCE, stop)
  oscillator.connect(filter)
  filter.connect(envelope)
  envelope.connect(context.destination)
  oscillator.addEventListener(
    'ended',
    () => {
      oscillator.disconnect()
      filter.disconnect()
      envelope.disconnect()
      releaseCue()
    },
    { once: true }
  )
  oscillator.start(start)
  oscillator.stop(stop)
}

export const playSignalActivityCue = (cue: SignalActivityCue): Promise<void> =>
  readArmedAudioContext()
    .then((context) =>
      match(
        fromNullable(context),
        (runningContext) => scheduleSignalActivityCue(runningContext, cue),
        () => undefined
      )
    )
    .catch(() => undefined)
