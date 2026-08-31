import { activityLabel } from '../../../../features/systems/portfolio/projects/projects/projectsSelectors'

describe('activityLabel', () => {
  it.each([
    ['push', 1, 'push'],
    ['push', 2, 'pushes'],
    ['issue', 2, 'issues'],
    ['pull_request', 2, 'pull requests'],
    ['comment', 2, 'comments'],
  ])('inflects %s at %i as %s', (kind, count, expected) => {
    expect(activityLabel(kind, count)).toBe(expected)
  })
})
