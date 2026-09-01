import type { StationKey } from '../apiTypes'

export type RuntimeRouteKey = 'nexus' | 'dossier' | 'missions' | 'telemetry'

export interface RuntimeNavigationPresentation {
  readonly pendingLabel: string
  readonly arrayLabel: string
  readonly appearanceLabel: string
  readonly operationsLabel: string
  readonly primaryLabel: string
  readonly menu: Readonly<{
    openLabel: string
    closeLabel: string
    openText: string
    closeText: string
  }>
  readonly routes: Readonly<
    Record<
      RuntimeRouteKey,
      Readonly<{ index: string; label: string; systemLabel: string }>
    >
  >
}

export interface RuntimeArchivePresentation {
  readonly heading: string
  readonly closeLabel: string
  readonly closeText: string
  readonly commandLabel: string
  readonly dialogLabel: string
  readonly openLabel: string
  readonly triggerLabel: string
  readonly initialLines: readonly string[]
  readonly placeholders: Readonly<{ neon: string; mirage: string }>
  readonly feedStates: Readonly<
    Record<'idle' | 'sync' | 'live' | 'stale' | 'partial' | 'offline', string>
  >
  readonly commands: Readonly<{
    help: readonly string[]
    noData: string
    noCommits: string
    noRepositoriesPrefix: string
    noRepositoriesSuffix: string
    labels: Readonly<Record<string, string>>
    undisclosed: string
    unknown: string
    repositoryUnit: string
    contributionUnit: string
    themeCycled: string
    themeSetPrefix: string
    themeSetSuffix: string
    unknownThemePrefix: string
    unknownThemeMiddle: string
    commandUnavailable: string
    openingPrefix: string
    openingSuffix: string
    navigationUsage: string
    unknownCommandPrefix: string
    unknownCommandSuffix: string
  }>
}

export interface RuntimeThemePresentation {
  readonly prefixLabel: string
  readonly downloadLabel: string
  readonly loadLabel: string
  readonly updateLabel: string
  readonly customLabel: string
  readonly feedback: Readonly<{
    importing: string
    ready: string
    exporting: string
    failed: string
  }>
}

export interface RuntimeSoundPresentation {
  readonly enabledText: string
  readonly disabledText: string
  readonly enableLabel: string
  readonly disableLabel: string
}

export interface RuntimeDossierPresentation {
  readonly eyebrow: string
  readonly evidenceLabel: string
  readonly languageRangeLabel: string
  readonly principlesLabel: string
  readonly stats: Readonly<{
    years: string
    repositories: string
    languages: string
    contributions: string
  }>
  readonly meters: Readonly<{ languages: string; principles: string }>
  readonly records: Readonly<{
    capabilities: string
    capabilitiesEmpty: string
    protocols: string
    protocolsEmpty: string
  }>
  readonly unitPlate: Readonly<{
    heading: string
    status: string
    traceLabel: string
    traceAccessibilityPrefix: string
    undisclosed: string
    recordSuffix: string
    rows: Readonly<{
      designation: string
      class: string
      incept: string
      origin: string
      operators: string
      primarySystems: string
    }>
  }>
}

export interface RuntimeSignalLatticePresentation {
  readonly headlineSuffix: string
  readonly accessibilityPrefix: string
  readonly lessLabel: string
  readonly moreLabel: string
  readonly levelLabel: string
  readonly months: readonly string[]
  readonly weekdays: readonly string[]
}

export interface RuntimeTelemetryPresentation {
  readonly eyebrow: string
  readonly statement: string
  readonly panels: Readonly<{
    uplink: string
    payload: string
    theme: string
    runtime: string
  }>
  readonly latencyUnit: string
  readonly emptyLabel: string
  readonly sourceLabel: string
  readonly labels: Readonly<Record<string, string>>
  readonly values: Readonly<Record<string, string>>
  readonly overall: Readonly<{
    nominal: string
    syncing: string
    degraded: string
  }>
  readonly deck: Readonly<{
    heading: string
    api: string
    theme: string
    brand: string
  }>
}

export interface RuntimePresentation {
  readonly errorBoundary: Readonly<{
    headline: string
    message: string
    retryLabel: string
  }>
  readonly layout: Readonly<{
    skipLabel: string
    workspaces: Readonly<Record<StationKey, string>>
  }>
  readonly navigation: RuntimeNavigationPresentation
  readonly archiveControl: RuntimeArchivePresentation
  readonly theme: RuntimeThemePresentation
  readonly sound: RuntimeSoundPresentation
  readonly dossier: RuntimeDossierPresentation
  readonly signalLattice: RuntimeSignalLatticePresentation
  readonly telemetry: RuntimeTelemetryPresentation
}
