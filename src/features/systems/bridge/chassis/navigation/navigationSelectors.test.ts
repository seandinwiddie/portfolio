import {
  selectMenuLabel,
  selectMenuText,
  selectNavigationLink,
} from './navigationSelectors'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'

const presentation = TEST_RUNTIME_PRESENTATION.navigation

describe('navigation selectors', () => {
  it('projects readable route and system labels with stable numeric indices', () => {
    expect(selectNavigationLink('/nexus', '/nexus')(presentation)).toEqual({
      href: '/nexus',
      index: '01',
      label: 'Test nexus',
      systemLabel: 'Test command',
      current: 'page',
    })
    expect(selectNavigationLink('/dossier', '/missions')(presentation)).toEqual({
      href: '/dossier',
      index: '02',
      label: 'Test dossier',
      systemLabel: 'Test record',
      current: undefined,
    })
    expect(selectNavigationLink('/missions', '/missions')(presentation).systemLabel).toBe(
      'Test operations'
    )
    expect(
      selectNavigationLink('/telemetry', '/telemetry')(presentation).systemLabel
    ).toBe('Test uplink')
  })

  it('describes the compact appearance drawer state', () => {
    expect(selectMenuLabel(false, presentation)).toBe('Test open menu')
    expect(selectMenuText(false, presentation)).toBe('Test controls')
    expect(selectMenuLabel(true, presentation)).toBe('Test close menu')
    expect(selectMenuText(true, presentation)).toBe('Test close')
  })

  it('keeps structural routes and compact controls operable before /data arrives', () => {
    expect(selectNavigationLink('/nexus', '/')(undefined)).toMatchObject({
      href: '/nexus',
      label: 'nexus',
    })
    expect(selectMenuLabel(false, undefined)).not.toHaveLength(0)
    expect(selectMenuText(false, undefined)).not.toHaveLength(0)
  })
})
