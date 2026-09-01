/** @jest-environment jsdom */

import { selectButtonFxCue } from '../../../../entities/bridge/console/buttonFx/buttonFxSelectors'
import { installButtonFxDelegation, playButtonFxCue } from './buttonFxAdapters'

const pointerOver = (pointerType: string, relatedTarget: EventTarget): Event => {
  const event = new Event('pointerover', { bubbles: true })

  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    relatedTarget: { value: relatedTarget },
  })

  return event
}

describe('buttonFx delegation', () => {
  it('suppresses touch and descendant transitions, announces controls, and cleans up', () => {
    document.body.replaceChildren()
    const button = document.createElement('button')
    const label = document.createElement('span')
    const hover = jest.fn()
    const press = jest.fn()

    button.setAttribute('aria-label', 'Open constellation')
    label.textContent = 'Open'
    button.append(label)
    document.body.append(button)

    const cleanup = installButtonFxDelegation({ hover, press })

    label.dispatchEvent(pointerOver('touch', document.body))
    label.dispatchEvent(pointerOver('mouse', button))
    label.dispatchEvent(pointerOver('mouse', document.body))
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(hover).toHaveBeenCalledTimes(1)
    expect(hover).toHaveBeenCalledWith('button:open-constellation')
    expect(press).toHaveBeenCalledTimes(1)

    cleanup?.()
    label.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(press).toHaveBeenCalledTimes(1)
  })

  it('unlocks only on press and layers a mechanical voice under the theme cue', async () => {
    const audioParam = {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    }
    const oscillator = {
      type: 'sine',
      frequency: audioParam,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    }
    const filter = {
      type: 'bandpass',
      frequency: audioParam,
      Q: audioParam,
      connect: jest.fn(),
    }
    const envelope = {
      gain: audioParam,
      connect: jest.fn(),
    }
    const context = {
      currentTime: 4,
      destination: {},
      state: 'suspended',
      createOscillator: jest.fn(() => ({ ...oscillator })),
      createBiquadFilter: jest.fn(() => ({ ...filter })),
      createGain: jest.fn(() => ({ ...envelope })),
      resume: jest.fn(),
    }
    context.resume.mockImplementation(() => {
      context.state = 'running'
      return Promise.resolve()
    })
    const AudioContextMock = jest.fn(() => context)

    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: AudioContextMock,
    })

    await playButtonFxCue(selectButtonFxCue('button:systems')('hover')('dark'))
    expect(AudioContextMock).not.toHaveBeenCalled()

    await playButtonFxCue(selectButtonFxCue('button:systems')('press')('dark'))
    expect(AudioContextMock).toHaveBeenCalledTimes(1)
    expect(context.resume).toHaveBeenCalledTimes(1)
    expect(context.createOscillator).toHaveBeenCalledTimes(3)
    expect(context.createBiquadFilter).toHaveBeenCalledTimes(2)
    expect(context.createGain).toHaveBeenCalledTimes(2)
  })
})
