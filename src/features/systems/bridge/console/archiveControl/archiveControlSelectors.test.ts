import { TEST_RUNTIME_PRESENTATION } from '../../../../../test/runtimePresentation.test.data'
import {
  selectArchiveControlCopy,
  selectArchiveFeedState,
} from './archiveControlSelectors'

describe('archive-control structural fallback', () => {
  it('keeps the trigger, dialog, close control, and command input accessibly named', () => {
    const copy = selectArchiveControlCopy(undefined)

    expect(copy.openLabel).not.toHaveLength(0)
    expect(copy.triggerLabel).not.toHaveLength(0)
    expect(copy.dialogLabel).not.toHaveLength(0)
    expect(copy.closeLabel).not.toHaveLength(0)
    expect(copy.commandLabel).not.toHaveLength(0)
  })

  it('honors stale and partial payload provenance for fulfilled requests', () => {
    const presentation = TEST_RUNTIME_PRESENTATION.archiveControl

    expect(
      selectArchiveFeedState(presentation)({
        status: 'fulfilled',
        hasData: true,
        stale: true,
        partial: false,
      })
    ).toBe('STALE')
    expect(
      selectArchiveFeedState(presentation)({
        status: 'fulfilled',
        hasData: true,
        stale: false,
        partial: true,
      })
    ).toBe('DEGRADED')
    expect(
      selectArchiveFeedState(presentation)({
        status: 'fulfilled',
        hasData: true,
        stale: false,
        partial: false,
      })
    ).toBe('LIVE')
  })

  it('distinguishes retained data after a failed refresh from a hard outage', () => {
    const presentation = TEST_RUNTIME_PRESENTATION.archiveControl

    expect(
      selectArchiveFeedState(presentation)({
        status: 'rejected',
        hasData: true,
        stale: false,
        partial: false,
      })
    ).toBe('STALE')
    expect(
      selectArchiveFeedState(presentation)({
        status: 'rejected',
        hasData: false,
        stale: false,
        partial: false,
      })
    ).toBe('OFFLINE')
  })
})
