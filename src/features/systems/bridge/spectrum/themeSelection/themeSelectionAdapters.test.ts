/** @jest-environment jsdom */

import {
  applyThemeModeToDocument,
  readBuiltInThemeAtBoot,
} from './themeSelectionAdapters'

describe('theme boot adapters', () => {
  it('validates the synchronous browser value used before hydration', () => {
    expect(readBuiltInThemeAtBoot({ getItem: () => 'light' })).toBe('light')
    expect(readBuiltInThemeAtBoot({ getItem: () => 'undefined' })).toBeNull()
  })

  it('fails safely when browser storage is unavailable', () => {
    expect(
      readBuiltInThemeAtBoot({
        getItem: () => {
          throw new Error('blocked storage')
        },
      })
    ).toBeNull()
  })

  it('projects custom light appearance and restores a built-in dark appearance', () => {
    applyThemeModeToDocument('custom', 'light')

    expect(document.documentElement.classList.contains('theme-custom')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('light')

    applyThemeModeToDocument('mirage', 'dark')

    expect(document.documentElement.classList.contains('theme-custom')).toBe(false)
    expect(document.documentElement.classList.contains('theme-mirage')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
