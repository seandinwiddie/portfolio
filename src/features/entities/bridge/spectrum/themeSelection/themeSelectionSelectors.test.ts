import { runInNewContext } from 'node:vm'
import { BUILT_IN_THEME_IDS } from '../../../../../styles/themes/themeTypes'
import {
  selectDocumentThemeMode,
  selectThemeBootClass,
  selectThemeBootViewModel,
  selectThemeRestorationReady,
  selectThemeToggleViewProps,
} from './themeSelectionSelectors'
import { initialThemeSelectionState } from './themeSelectionSlice'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'

const executeBootScript = (
  storedTheme: string | null,
  readError: Error | null = null
): readonly string[] => {
  const classes = new Set(['theme-mirage'])
  const failure = readError ?? new Error('storage unavailable')
  const storage = {
    getItem:
      readError === null
        ? () => storedTheme
        : () => {
            throw failure
          },
  }
  const classList = {
    add: (value: string) => classes.add(value),
    remove: (...values: string[]) => values.forEach((value) => classes.delete(value)),
  }

  runInNewContext(selectThemeBootViewModel().script, {
    window: {
      ['doc' + 'ument']: { documentElement: { classList } },
      ['local' + 'Storage']: storage,
    },
  })

  return [...classes]
}

describe('theme boot selectors', () => {
  it.each(BUILT_IN_THEME_IDS)('projects persisted %s before hydration', (id) => {
    expect(selectThemeBootClass(id)).toBe(`theme-${id}`)
    expect(executeBootScript(id)).toEqual([`theme-${id}`])
  })

  it('falls back to Mirage for missing, invalid, and unavailable browser storage', () => {
    expect(selectThemeBootClass(null)).toBe('theme-mirage')
    expect(selectThemeBootClass('custom')).toBe('theme-mirage')
    expect(executeBootScript(null)).toEqual(['theme-mirage'])
    expect(executeBootScript('unknown')).toEqual(['theme-mirage'])
    expect(executeBootScript('__proto__')).toEqual(['theme-mirage'])
    expect(executeBootScript('dark', new Error('denied'))).toEqual(['theme-mirage'])
  })

  it('projects boot paint for every built-in profile', () => {
    const { stylesheet } = selectThemeBootViewModel()

    expect(
      BUILT_IN_THEME_IDS.every((id) => stylesheet.includes(`html.theme-${id}`))
    ).toBe(true)
  })

  it('withholds document repaint until stored-theme restoration finishes', () => {
    const pending = { themeSelection: initialThemeSelectionState }
    const restored = {
      themeSelection: {
        ...initialThemeSelectionState,
        mode: 'dark' as const,
        restorationStatus: 'ready' as const,
      },
    }

    expect(selectDocumentThemeMode(pending)).toBeNull()
    expect(selectThemeRestorationReady(pending)).toBe(false)
    expect(selectDocumentThemeMode(restored)).toBe('dark')
    expect(selectThemeRestorationReady(restored)).toBe(true)
  })

  it('retains toggle projection identity across unrelated dispatch state', () => {
    const state = { themeSelection: initialThemeSelectionState }
    const presentation = TEST_RUNTIME_PRESENTATION.theme

    expect(selectThemeToggleViewProps(state, presentation)).toBe(
      selectThemeToggleViewProps({ ...state }, presentation)
    )
  })
})
