// Canonical portfolio concern tree. It preserves therapy-11's pillar -> branch
// -> domain topology while using the portfolio's own bounded concerns. Runtime
// authored data remains intentionally different: portfolio domains receive it
// through the system API/RTK Query boundary, never from a local data catalog.
export const CONCERN_TREE = {
  portfolio: {
    profile: ['about', 'body', 'content', 'home', 'welcome'],
    projects: ['projects'],
    diagnostics: ['status'],
    routing: ['notFound'],
  },
  platform: {
    foundation: ['api', 'boot', 'composition'],
    observability: ['diagnostics'],
    ui: ['presentation'],
  },
  shell: {
    frame: ['ambientScene', 'brandName', 'layout', 'navigation', 'telemetry'],
    controls: ['archiveControl', 'experience'],
    themes: ['themeCustom', 'themeSelection'],
  },
}

// Expo route domains remain direct children of src/views by contract. The
// reusable presentation domains below them still use the same bounded concern
// branches as the feature tree.
export const VIEW_TREE = {
  about: { '.': [] },
  home: { '.': [] },
  html: { '.': [] },
  index: { '.': [] },
  layout: { '.': [] },
  notFound: { '.': [] },
  projects: { '.': [] },
  status: { '.': [] },
  portfolio: {
    profile: [
      'about',
      'content',
      'contentSections',
      'home',
      'portfolioFeatures',
      'welcome',
    ],
    projects: [
      'contributionGraph',
      'projectActivity',
      'projectArchive',
      'projectLanguages',
      'projectOwners',
      'projects',
    ],
    diagnostics: ['installQr', 'signalTrace', 'status', 'statusPage', 'unitPlate'],
    routing: ['notFound'],
  },
  shared: {
    '.': ['errorBoundary', 'pageHead', 'panel', 'screen'],
  },
  shell: {
    frame: ['ambientScene', 'brandName', 'footer', 'navigation', 'telemetry'],
    controls: ['archiveControl', 'experienceToggle', 'themeCustom', 'themeToggle'],
  },
}

/**
 * Resolve the feature domain after its ownership pillar and concern branch.
 * Absolute prefixes are tolerated by anchoring on the features segment.
 */
export const domainKeyFor = (relativePath) => {
  const segments = String(relativePath).split('/')
  const featuresIndex = segments.indexOf('features')
  const pillar = segments[featuresIndex + 2]
  const branches = CONCERN_TREE[pillar]

  if (featuresIndex < 0 || !branches) return null

  const branch = segments[featuresIndex + 3]
  const domains = branches[branch]
  const domain = segments[featuresIndex + 4]

  return !domains || !domains.includes(domain)
    ? null
    : {
        domainKey: segments.slice(0, featuresIndex + 5).join('/'),
        subdomainStart: featuresIndex + 5,
      }
}
