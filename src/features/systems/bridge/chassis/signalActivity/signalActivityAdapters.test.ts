/** @jest-environment jsdom */

import type { SignalActivityCue } from '../../../../components/bridge/chassis/signalActivity/signalActivityTypes'
import {
  playSignalActivityCue,
  scheduleSignalActivityCue,
} from './signalActivityAdapters'

const cue: SignalActivityCue = {
  id: 'query-resolve',
  frequency: 146,
  destinationFrequency: 220,
  filterFrequency: 1160,
  durationSeconds: 0.18,
  attackSeconds: 0.018,
  delayMs: 48,
  gain: 0.011,
  filterQ: 4.4,
  waveform: 'triangle',
}

const audioNode = () => ({ connect: jest.fn(), disconnect: jest.fn() })

describe('signalActivity audio adapter', () => {
  it('does not construct an audio context before a visitor gesture arms the shared bus', async () => {
    const AudioContextMock = jest.fn()
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: AudioContextMock,
    })

    await playSignalActivityCue(cue)

    expect(AudioContextMock).not.toHaveBeenCalled()
  })

  it('schedules the API-authored envelope without changing its acoustic values', () => {
    const parameter = {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    }
    const oscillator = {
      ...audioNode(),
      type: 'sine',
      frequency: parameter,
      addEventListener: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    }
    const filter = {
      ...audioNode(),
      type: 'lowpass',
      frequency: parameter,
      Q: parameter,
    }
    const envelope = { ...audioNode(), gain: parameter }
    const context = {
      currentTime: 4,
      destination: {},
      createOscillator: jest.fn(() => oscillator),
      createBiquadFilter: jest.fn(() => filter),
      createGain: jest.fn(() => envelope),
    } as unknown as AudioContext

    scheduleSignalActivityCue(context, cue)

    expect(oscillator.type).toBe('triangle')
    expect(parameter.setValueAtTime).toHaveBeenCalledWith(146, 4.048)
    expect(parameter.setValueAtTime).toHaveBeenCalledWith(1160, 4.048)
    expect(parameter.setValueAtTime).toHaveBeenCalledWith(4.4, 4.048)
    expect(parameter.exponentialRampToValueAtTime).toHaveBeenCalledWith(220, 4.228)
    expect(parameter.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.011, 4.066)
    expect(oscillator.start).toHaveBeenCalledWith(4.048)
    expect(oscillator.stop).toHaveBeenCalledWith(4.228)

    const ended = oscillator.addEventListener.mock.calls[0]?.[1]
    ended?.()
    expect(oscillator.disconnect).toHaveBeenCalledTimes(1)
    expect(filter.disconnect).toHaveBeenCalledTimes(1)
    expect(envelope.disconnect).toHaveBeenCalledTimes(1)
  })

  it('caps simultaneous ambient voices while allowing a new cue after cleanup', () => {
    const parameter = {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    }
    const ended: Array<() => void> = []
    const oscillator = () => ({
      ...audioNode(),
      type: 'sine' as OscillatorType,
      frequency: parameter,
      addEventListener: jest.fn((_type: string, listener: () => void) =>
        ended.push(listener)
      ),
      start: jest.fn(),
      stop: jest.fn(),
    })
    const context = {
      currentTime: 4,
      destination: {},
      createOscillator: jest.fn(oscillator),
      createBiquadFilter: jest.fn(() => ({
        ...audioNode(),
        type: 'lowpass',
        frequency: parameter,
        Q: parameter,
      })),
      createGain: jest.fn(() => ({ ...audioNode(), gain: parameter })),
    } as unknown as AudioContext

    scheduleSignalActivityCue(context, cue)
    scheduleSignalActivityCue(context, cue)
    scheduleSignalActivityCue(context, cue)
    expect(context.createOscillator).toHaveBeenCalledTimes(2)

    ended[0]?.()
    scheduleSignalActivityCue(context, cue)
    expect(context.createOscillator).toHaveBeenCalledTimes(3)
  })
})
