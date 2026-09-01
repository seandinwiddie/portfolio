// Canonical registry concern tree. It preserves therapy-11's pillar -> branch
// -> domain topology while using the registry's own bounded concerns. Runtime
// authored data remains intentionally different: registry domains receive it
// through the system API/RTK Query boundary, never from a local data catalog.
export const CONCERN_TREE = {
  registry: {
    dossier: ['ingress', 'manifest', 'nexus', 'records'],
    missions: ['operations'],
    observatory: ['signalArray'],
    telemetry: ['diagnostics'],
    wayfinding: ['lostSignal'],
  },
  substrate: {
    kernel: ['api', 'boot', 'composition'],
    observability: ['diagnostics'],
    ui: ['presentation'],
  },
  bridge: {
    chassis: [
      'ambientScene',
      'brandName',
      'layout',
      'navigation',
      'telemetry',
      'utilityRail',
    ],
    console: ['archiveControl', 'buttonFx', 'overlayMatrix'],
    spectrum: ['themeCustom', 'themeSelection'],
  },
}

// Expo route domains remain direct children of src/views by contract. The
// reusable presentation domains below them still use the same bounded concern
// branches as the feature tree.
export const VIEW_TREE = {
  dossier: { '.': [] },
  html: { '.': [] },
  ingress: { '.': [] },
  layout: { '.': [] },
  lostSignal: { '.': [] },
  missions: { '.': [] },
  nexus: { '.': [] },
  telemetry: { '.': [] },
  registry: {
    dossier: [
      'ingress',
      'manifest',
      'nexus',
      'recordBanks',
      'records',
      'registryCapabilities',
    ],
    missions: [
      'missionArchive',
      'missionCustodians',
      'missionDialects',
      'missionPulse',
      'signalLattice',
    ],
    observatory: ['signalArray'],
    telemetry: ['diagnostics', 'installQr', 'signalTrace', 'telemetryDeck', 'unitPlate'],
    wayfinding: ['lostSignal'],
  },
  aperture: {
    '.': ['errorBoundary', 'panel', 'screen', 'signalMeta'],
  },
  bridge: {
    chassis: ['ambientScene', 'brandName', 'navigation', 'telemetry', 'utilityRail'],
    console: ['archiveControl', 'themeCustom', 'themeToggle'],
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
