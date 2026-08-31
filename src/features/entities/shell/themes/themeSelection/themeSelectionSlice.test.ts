import reducer, {
  builtInThemeSelected,
  customThemeSelected,
  initialThemeReceived,
  initialThemeSelectionState,
  storedThemeRestored,
  themeCatalogLoaded,
  themeSelectionCycled,
} from './themeSelectionSlice'

describe('themeSelectionSlice', () => {
  it('starts from the canonical Mirage profile and full shipped catalog', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialThemeSelectionState)
  })

  it('uses stored preference over API bootstrap regardless of arrival order', () => {
    const fromApi = reducer(initialThemeSelectionState, initialThemeReceived('dark'))
    const fromStorage = reducer(fromApi, storedThemeRestored('neon'))
    const lateApi = reducer(fromStorage, initialThemeReceived('light'))

    expect(lateApi).toMatchObject({ mode: 'neon', authority: 'stored' })
  })

  it('never lets late restoration or API data overwrite a visitor event', () => {
    const visitor = reducer(initialThemeSelectionState, builtInThemeSelected('dracula'))
    const lateStorage = reducer(visitor, storedThemeRestored('dark'))
    const lateApi = reducer(lateStorage, initialThemeReceived('light'))

    expect(lateApi).toMatchObject({ mode: 'dracula', authority: 'visitor' })
  })

  it('rejects invalid stored, API, and selection values', () => {
    const invalidApi = reducer(
      initialThemeSelectionState,
      initialThemeReceived('solarized')
    )
    const invalidStored = reducer(invalidApi, storedThemeRestored('ayu'))
    const invalidSelection = reducer(invalidStored, builtInThemeSelected('undefined'))

    expect(invalidSelection).toEqual(initialThemeSelectionState)
  })

  it('keeps custom explicit and cycles it into the first validated built-in profile', () => {
    const custom = reducer(initialThemeSelectionState, customThemeSelected())
    const cycled = reducer(custom, themeSelectionCycled())

    expect(custom.mode).toBe('custom')
    expect(cycled.mode).toBe('dark')
  })

  it('validates catalog entries without changing selection authority', () => {
    const selected = reducer(initialThemeSelectionState, builtInThemeSelected('neon'))
    const cataloged = reducer(
      selected,
      themeCatalogLoaded(['light', 'invalid', 'light', 'dracula'])
    )

    expect(cataloged).toMatchObject({
      mode: 'neon',
      themes: ['dracula', 'light'],
      status: 'ready',
      authority: 'visitor',
    })
  })
})
