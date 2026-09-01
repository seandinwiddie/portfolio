export type AgentSurfaceRoute =
  | 'ingress'
  | 'nexus'
  | 'dossier'
  | 'missions'
  | 'telemetry'
  | 'lostSignal'

export type AgentSurfaceLink = Readonly<{
  rel: string
  href: string
  type: string
}>

export type AgentSurfaceManifest = Readonly<{
  schemaVersion: string
  kind: 'public-api-manifest'
  service: string
  description: string
  canonicalBaseUrl: string
  links: readonly AgentSurfaceLink[]
  usage: Readonly<{
    readOnly: boolean
    authentication: string
    responseMediaType: string
    rateLimitHeaders: readonly string[]
  }>
}>

export type AgentSurfaceInput = Readonly<{
  route: AgentSurfaceRoute
  fullTitle: string
  description: string
  registryName: string
  manifest: AgentSurfaceManifest | undefined
}>

export type AgentSurfaceProjection = Readonly<{
  routeId: string
  schemaVersion: string | null
  robotsPolicy: 'index,follow' | 'noindex,follow'
  canonicalUrl: string | null
  manifestUrl: string | null
  dataAuthorityUrl: string | null
  documentationUrl: string | null
  sourceUrl: string | null
  structuredData: string | null
}>
