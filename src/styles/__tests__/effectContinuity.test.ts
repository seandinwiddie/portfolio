import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const stylesheet = (name: string): string =>
  readFileSync(join(process.cwd(), 'src', 'styles', name), 'utf8')

describe('continuous visual effects', () => {
  const app = stylesheet('app.css')
  const signal = stylesheet('signal.css')
  const system = stylesheet('system.css')

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

    expect(compact).toContain('flex: 0 0 44px')
    expect(compact).toContain('max-width: min(185px, calc(100vw - 88px))')
    expect(compact).toContain('padding-right: 0 !important')
  })

  it('keeps the iPhone SE dock at the bottom and every persistent control tappable', () => {
    const compact = system.slice(system.indexOf('@media (max-width: 1020px)'))
    const phone = system.slice(system.indexOf('@media (max-width: 660px)'))

    expect(system).toContain('.system-skip-link {\n  position: fixed !important')
    expect(system).toContain('z-index: 1000 !important')
    expect(compact).toContain('.system-route-dock {\n    position: relative !important')
    expect(system).toContain('--mobile-archive-rail-height: 60px')
    expect(compact).toContain('var(--mobile-archive-rail-height)')
    expect(compact).toContain('grid-row: 4')
    expect(compact).toContain('grid-row: 5')
    expect(compact).toContain('.system-route-region {\n    grid-row: 2')
    expect(phone).toContain('animation-name: command-lens-mobile')
    expect(phone).toContain('.dossier-domain .panel-frame {\n    height: auto')
    expect(compact).toContain('max-width: calc(100% - 12px)')
    expect(phone).toContain('.telemetry-row-value {')
    expect(phone).toContain('overflow-wrap: anywhere')
    expect(phone).toContain('font-size: 9px')
    expect(phone).toContain(
      '.system-route-dock .system-nav-secondary {\n    display: none !important'
    )
    expect(phone).toContain(
      '[data-testid="archive-control-trigger"] {\n    min-height: 44px !important'
    )
    expect(phone).toContain('max-width: 100vw !important')
    expect(phone).toContain('overflow-x: hidden !important')
  })

  it('ships both navigation shells and lets media CSS own their visibility', () => {
    expect(system).toContain('.system-navigation--compact {\n  display: none !important;')
    expect(system).toContain('.system-navigation--rail {\n    display: none !important;')
    expect(system).toContain(
      '.system-navigation--compact {\n    display: flex !important;'
    )
  })
})
