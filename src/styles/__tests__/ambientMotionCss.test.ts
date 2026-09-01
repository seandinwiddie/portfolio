import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TEST_AMBIENT_SCENE } from '../../test/apiPayload.test.data'

const stylesheet = (name: string): string =>
  readFileSync(join(process.cwd(), 'src', 'styles', name), 'utf8')

describe('quiet continuous ambient motion', () => {
  const app = stylesheet('app.css')
  const system = stylesheet('system.css')

  it('keeps the field alive with slow, phase-separated API motion', () => {
    expect(app).toContain('animation-iteration-count: infinite')
    expect(system).toContain('animation: command-lens 72s linear infinite')
    expect(
      Object.values(TEST_AMBIENT_SCENE.motions).every(({ delay }) => delay < 0)
    ).toBe(true)
    expect(
      Object.values(TEST_AMBIENT_SCENE.motions).every(({ duration }) => duration >= 19)
    ).toBe(true)
  })

  it('bounds passive opacity, scale, rotation, and local drift', () => {
    expect(app).toContain('--ambient-field-opacity: 0.6')
    expect(app).toContain('--ambient-stars-opacity: 0.16')
    expect(app).toContain('scale(1.006)')
    expect(app).toContain('var(--scene-rotation) + 1.5deg')
    expect(TEST_AMBIENT_SCENE.motions['archive-orbit'].drift).toBeLessThanOrEqual(2)
    expect(TEST_AMBIENT_SCENE.motions['survey-monolith'].drift).toBeLessThanOrEqual(2)
  })

  it('keeps high-emission themes expressive without saturating the background', () => {
    expect(system).toContain('.theme-neon .orbital-stars {\n  opacity: 0.26')
    expect(system).toContain('.theme-ruby .orbital-stars {\n  opacity: 0.23')
  })
})
