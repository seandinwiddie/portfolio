import type { ButtonFxIdentityProjection } from '../../../../components/bridge/console/buttonFx/buttonFxTypes'
import { selectButtonFxCue, selectButtonFxIdentity } from './buttonFxSelectors'

const projection: ButtonFxIdentityProjection = {
  tag: 'BUTTON',
  explicitId: 'archive.open',
  testId: 'ignored-test-id',
  accessibleName: 'Ignored accessible name',
  href: null,
  text: 'Ignored text',
  structuralPath: '/missions#control-4',
}

describe('buttonFx selectors', () => {
  it('projects a stable identity from the highest-priority semantic evidence', () => {
    expect(selectButtonFxIdentity(projection)).toBe('button:archive.open')
    expect(selectButtonFxIdentity(projection)).toBe(selectButtonFxIdentity(projection))
  })

  it('falls through the semantic evidence without coupling identity to DOM order', () => {
    expect(
      selectButtonFxIdentity({
        ...projection,
        explicitId: null,
        testId: null,
        accessibleName: 'Open command deck',
        structuralPath: '/nexus#control-2',
      })
    ).toBe('button:open-command-deck')
  })

  it('uses structural location only to distinguish otherwise anonymous controls', () => {
    expect(
      selectButtonFxIdentity({
        tag: 'button',
        explicitId: null,
        testId: null,
        accessibleName: null,
        href: null,
        text: null,
        structuralPath: '/nexus#control-2',
      })
    ).toBe('button:anonymous:/nexus#control-2')
  })

  it('resolves deterministic and distinct hover, press, identity, and theme cues', () => {
    const identity = selectButtonFxIdentity(projection)
    const darkHover = selectButtonFxCue(identity)('hover')('dark')
    const darkPress = selectButtonFxCue(identity)('press')('dark')
    const repeatedPress = selectButtonFxCue(identity)('press')('dark')
    const neonPress = selectButtonFxCue(identity)('press')('neon')
    const rubyPress = selectButtonFxCue(identity)('press')('ruby')
    const otherPress = selectButtonFxCue(`${identity}:alternate`)('press')('dark')

    expect(repeatedPress).toEqual(darkPress)
    expect(darkHover).not.toEqual(darkPress)
    expect(neonPress).not.toEqual(darkPress)
    expect(rubyPress).not.toEqual(darkPress)
    expect(rubyPress).not.toEqual(neonPress)
    expect(otherPress.frequency).not.toBe(darkPress.frequency)
    expect(darkPress.mechanicalTransient.gain).toBeGreaterThan(
      darkHover.mechanicalTransient.gain
    )
    expect(darkPress.mechanicalTransient.durationSeconds).toBeGreaterThan(
      darkHover.mechanicalTransient.durationSeconds
    )
    expect(darkPress.mechanicalTransient.waveform).toBe('square')
    expect(darkHover.mechanicalTransient.waveform).toBe('triangle')
    expect(neonPress.mechanicalTransient).not.toEqual(darkPress.mechanicalTransient)
    expect(otherPress.mechanicalTransient.frequency).not.toBe(
      darkPress.mechanicalTransient.frequency
    )
  })
})
