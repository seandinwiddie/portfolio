import {
  executeArchiveCommand,
  MAX_ARCHIVE_COMMAND_LENGTH,
  normalizeArchiveCommand,
} from './commandSelectors'
import { TEST_RUNTIME_PRESENTATION } from '../../../../../../test/runtimePresentation.test.data'

const context = {
  feedState: 'LIVE' as const,
  themes: ['mirage', 'dark'],
  copy: TEST_RUNTIME_PRESENTATION.archiveControl.commands,
}

describe('Archive Control system commands', () => {
  it('projects canonical stations into route effects', () => {
    expect(executeArchiveCommand('go missions', context).effect).toEqual({
      type: 'navigate',
      href: '/missions',
    })
  })

  it('keeps invalid commands effect-free and provides usage', () => {
    const result = executeArchiveCommand('go unknown', context)

    expect(result.effect).toEqual({ type: 'none' })
    expect(result.lines).toEqual(['Test navigation usage'])
  })

  it('bounds pasted command input before parsing or projecting it', () => {
    const oversized = 'x'.repeat(MAX_ARCHIVE_COMMAND_LENGTH * 8)
    const bounded = normalizeArchiveCommand(oversized)
    const result = executeArchiveCommand(oversized, context)

    expect(bounded).toHaveLength(MAX_ARCHIVE_COMMAND_LENGTH)
    expect(result.lines.join('')).toContain(bounded)
    expect(result.lines.join('')).not.toContain(
      'x'.repeat(MAX_ARCHIVE_COMMAND_LENGTH + 1)
    )
  })
})
