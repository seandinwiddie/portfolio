import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const stylesheet = (name: string): string =>
  readFileSync(join(process.cwd(), 'src', 'styles', name), 'utf8')

const source = (...segments: readonly string[]): string =>
  readFileSync(join(process.cwd(), 'src', ...segments), 'utf8')

describe('continuous visual effects', () => {
  const app = stylesheet('app.css')
  const signal = stylesheet('signal.css')
  const system = stylesheet('system.css')
  const navigationView = source(
    'views',
    'bridge',
    'chassis',
    'navigation',
    'navigationView.tsx'
  )

  it('keeps compact scene geometry visible', () => {
    expect(app).not.toMatch(/\.orbital-monolith\s*\{[^}]*display\s*:\s*none/su)
    expect(system).not.toMatch(
      /\.system-route-region::after\s*\{[^}]*display\s*:\s*none/su
    )
  })

  it('reserves the registry-link pseudo-element for its global light sweep', () => {
    expect(app).not.toContain('.registry-link::after')
    expect(app).toContain('.registry-link-arrow')
  })

  it('keeps panel brackets while scanning UnitPlate with a real child', () => {
    expect(signal).toContain('.panel-frame::after')
    expect(signal).toContain('.plate-scan-beam')
    expect(signal).not.toContain('.plate-scan::after')
  })

  it('removes every shared glass filter in forced-colors mode', () => {
    const forcedColors = system.slice(system.indexOf('@media (forced-colors: active)'))

    expect(forcedColors).toContain('.system-navigation')
    expect(forcedColors).toContain('.system-telemetry-region .telemetry')
    expect(forcedColors).toContain('.system-utility-rail-region footer')
    expect(forcedColors).toContain('backdrop-filter: none')
  })

  it('reserves a bounded 44px control inside the iPhone SE navigation budget', () => {
    const compact = system.slice(system.indexOf('@media (max-width: 360px)'))

    expect(compact).toContain('flex: 0 0 auto')
    expect(compact).toContain('max-width: min(185px, calc(100vw - 112px))')
    expect(compact).toContain('min-width: 76px')
  })

  it('keeps the iPhone SE dock at the bottom and every persistent control tappable', () => {
    const compact = system.slice(system.indexOf('@media (max-width: 1020px)'))
    const phone = system.slice(system.indexOf('@media (max-width: 660px)'))

    expect(system).toContain('.system-skip-link {\n  position: fixed !important')
    expect(system).toContain('z-index: 1000 !important')
    expect(navigationView).toContain('testID="route-dock"')
    expect(compact).toContain(
      ':is(.system-route-dock, [data-testid="route-dock"]) {\n    position: relative !important'
    )
    expect(system).toContain('--mobile-archive-rail-height: 60px')
    expect(compact).toContain('var(--mobile-archive-rail-height)')
    expect(compact).toContain('grid-row: 4 !important')
    expect(compact).toContain('grid-row: 5')
    expect(compact).toContain('.system-route-region {\n    grid-row: 2')
    expect(phone).toContain('animation-name: command-lens-mobile')
    expect(phone).toContain('.dossier-domain .panel-frame {\n    height: auto')
    expect(compact).toContain('max-width: calc(100% - 12px)')
    expect(phone).toContain('.telemetry-row-value {')
    expect(phone).toContain('overflow-wrap: anywhere')
    expect(phone).toContain('font-size: 11px !important')
    expect(phone).not.toContain('font-size: 0 !important')
    expect(phone).toContain('min-width: 76px')
    expect(phone).toContain('content: none')
    expect(phone).toContain(
      ':is(.system-route-dock, [data-testid="route-dock"]) .system-nav-secondary {\n    display: none !important'
    )
    expect(phone).toContain(
      '[data-testid="archive-control-trigger"] {\n    min-height: 44px !important'
    )
    expect(phone).toContain('max-width: 100vw !important')
    expect(phone).toContain('overflow-x: hidden !important')
  })

  it('reserves a desktop archive lane between route content and utility chrome', () => {
    const desktop = system.slice(system.indexOf('@media (min-width: 1021px)'))

    expect(system).toContain('--desktop-utility-rail-height: 60px')
    expect(system).toContain('--desktop-archive-rail-height: 60px')
    expect(system).toContain('var(--desktop-archive-rail-height)')
    expect(desktop).toContain('.system-utility-rail-region {\n    grid-row: 4')
    expect(desktop).toContain(
      'bottom: calc(var(--desktop-utility-rail-height) + 8px) !important'
    )
  })

  it('ships both navigation shells and lets media CSS own their visibility', () => {
    expect(system).toContain('.system-navigation--compact {\n  display: none !important;')
    expect(system).toContain('.system-navigation--rail {\n    display: none !important;')
    expect(system).toContain(
      '.system-navigation--compact {\n    display: flex !important;'
    )
  })
})
