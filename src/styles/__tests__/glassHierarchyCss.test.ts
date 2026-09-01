import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const systemCss = readFileSync(join(process.cwd(), 'src', 'styles', 'system.css'), 'utf8')

describe('system glass hierarchy', () => {
  it('defines distinct content, chrome, and raised material roles', () => {
    expect(systemCss).toContain('--system-glass-content:')
    expect(systemCss).toContain('--system-glass-chrome:')
    expect(systemCss).toContain('--system-glass-raised:')
    expect(systemCss).not.toContain('--system-glass-surface:')
  })

  it('keeps depth restrained and theme-derived', () => {
    expect(systemCss).toContain('--system-glass-specular: inset 1px 1px')
    expect(systemCss).toContain('--system-glass-depth: 0 12px 36px')
    expect(systemCss).toContain('var(--background-color) 42%')
  })

  it('assigns system chrome separately from content instruments', () => {
    expect(systemCss.match(/var\(--system-glass-chrome\)/g)).toHaveLength(4)
    expect(systemCss.match(/var\(--system-glass-content\)/g)).toHaveLength(2)
    expect(systemCss.match(/var\(--system-glass-raised\)/g)).toHaveLength(3)
  })
})
