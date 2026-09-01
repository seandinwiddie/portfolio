import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const stylesheet = (name: string): string =>
  readFileSync(join(process.cwd(), 'src', 'styles', name), 'utf8')

const signalActivity = stylesheet('signalActivity.css')
const app = stylesheet('app.css')
const signal = stylesheet('signal.css')
const system = stylesheet('system.css')

const between = (source: string, start: string, end: string): string =>
  source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))

describe('API-authored signal activity motion', () => {
  it('ships a distinct one-shot instrument response for every activity kind', () => {
    ;['sync', 'resolve', 'transit', 'fault'].forEach((kind) => {
      expect(signalActivity).toContain(`.orbital-signal-${kind}`)
      expect(signalActivity).toContain(`@keyframes orbital-signal-${kind}`)
    })
  })

  it('drives amplitude, duration, geometry, and travel through API projection variables', () => {
    ;[
      '--signal-activity-duration',
      '--signal-activity-intensity',
      '--signal-activity-x',
      '--signal-activity-y',
      '--signal-activity-rotation',
      '--signal-activity-travel',
      '--signal-activity-spread',
    ].forEach((variable) => expect(signalActivity).toContain(`var(${variable})`))
  })

  it('keeps an active low-motion and forced-color response instead of disabling the layer', () => {
    const reducedMotion = signalActivity.slice(
      signalActivity.indexOf('@media (prefers-reduced-motion: reduce)')
    )
    const forcedColors = signalActivity.slice(
      signalActivity.indexOf('@media (forced-colors: active)')
    )

    const appReducedMotion = between(
      app,
      '@media (prefers-reduced-motion: reduce)',
      '@media (forced-colors: active)'
    )
    const systemReducedMotion = between(
      system,
      '@media (prefers-reduced-motion: reduce)',
      '@media (forced-colors: active)'
    )
    const appForcedColors = app.slice(app.indexOf('@media (forced-colors: active)'))

    expect(reducedMotion).toContain('animation-name: orbital-signal-reduced !important')
    expect(reducedMotion).not.toContain('animation: none')
    expect(forcedColors).not.toContain('display: none')
    expect(appReducedMotion).not.toContain('0.01ms')
    expect(appReducedMotion).not.toContain('animation: none')
    expect(systemReducedMotion).not.toContain('animation: none')
    expect(systemReducedMotion).not.toContain('transition: none')
    expect(signal).not.toContain('animation: none')
    expect(appForcedColors).not.toMatch(/\.orbital-scene\s*\{[^}]*display\s*:\s*none/su)
  })
})
