import { fromNullable, match } from 'functional-programming-composition'
import type {
  AgentSurfaceInput,
  AgentSurfaceLink,
  AgentSurfaceManifest,
  AgentSurfaceProjection,
  AgentSurfaceRoute,
} from '../../../../../components/substrate/kernel/api/agentSurface/agentSurfaceTypes'

const SCHEMA_CONTEXT = 'https://schema.org'
const MANIFEST_SERVICE = 'api.sdin.dev'
const MANIFEST_ORIGIN = 'https://api.sdin.dev'
const PORTFOLIO_ORIGIN = 'https://portfolio.sdin.dev'
const requiredRelations = [
  'self',
  'portfolio',
  'authoritative-data',
  'documentation',
  'source',
] as const
const requiredLinkTypes: Readonly<Record<(typeof requiredRelations)[number], string>> = {
  self: 'application/json',
  portfolio: 'text/html',
  'authoritative-data': 'application/json',
  documentation: 'text/markdown',
  source: 'text/html',
}

const routePaths: Readonly<Record<AgentSurfaceRoute, string | null>> = {
  ingress: '/',
  nexus: '/nexus',
  dossier: '/dossier',
  missions: '/missions',
  telemetry: '/telemetry',
  lostSignal: null,
}

const routeIds: Readonly<Record<AgentSurfaceRoute, string>> = {
  ingress: 'portfolio:ingress',
  nexus: 'portfolio:nexus',
  dossier: 'portfolio:dossier',
  missions: 'portfolio:missions',
  telemetry: 'portfolio:telemetry',
  lostSignal: 'portfolio:lost-signal',
}

const hrefFor = (links: readonly AgentSurfaceLink[], rel: string): string | null =>
  links.find((link) => link.rel === rel)?.href ?? null

const manifestIsUsable = (manifest: AgentSurfaceManifest | undefined): boolean => {
  const links = manifest?.links ?? []
  const relations = links.map(({ rel }) => rel)
  return Boolean(
    manifest?.kind === 'public-api-manifest' &&
      /^\d+\.\d+\.\d+$/u.test(manifest.schemaVersion) &&
      manifest.service === MANIFEST_SERVICE &&
      manifest.description.length > 0 &&
      manifest.canonicalBaseUrl === MANIFEST_ORIGIN &&
      manifest.usage.readOnly === true &&
      manifest.usage.authentication === 'none' &&
      manifest.usage.responseMediaType === 'application/json' &&
      manifest.usage.rateLimitHeaders.length > 0 &&
      requiredRelations.every((relation) =>
        links.some(
          (link) => link.rel === relation && link.type === requiredLinkTypes[relation]
        )
      ) &&
      relations.every((relation, index) => relations.indexOf(relation) === index) &&
      links.every(
        ({ rel, href, type }) =>
          /^[a-z][a-z0-9-]*$/u.test(rel) && href.startsWith('https://') && type.length > 0
      ) &&
      hrefFor(links, 'self') === `${MANIFEST_ORIGIN}/agent-manifest` &&
      hrefFor(links, 'authoritative-data') === `${MANIFEST_ORIGIN}/data` &&
      hrefFor(links, 'portfolio') === PORTFOLIO_ORIGIN
  )
}

const linksFrom = (
  manifest: AgentSurfaceManifest | undefined
): readonly AgentSurfaceLink[] =>
  manifestIsUsable(manifest) ? (manifest?.links ?? []) : []

const canonicalFor = (baseUrl: string | null, routePath: string | null): string | null =>
  match(
    fromNullable(routePath),
    (path) =>
      baseUrl?.startsWith('https://') ? `${baseUrl.replace(/\/+$/u, '')}${path}` : null,
    () => null
  )

const serializeStructuredData = (value: Readonly<Record<string, unknown>>): string =>
  JSON.stringify(value).replace(/</gu, '\\u003c')

const structuredDataFor = (
  input: AgentSurfaceInput,
  canonicalUrl: string | null
): string | null => {
  const links = linksFrom(input.manifest)
  return match(
    fromNullable(canonicalUrl),
    (url) =>
      serializeStructuredData({
        '@context': SCHEMA_CONTEXT,
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: input.fullTitle,
        description: input.description,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${hrefFor(links, 'portfolio')}#website`,
          url: hrefFor(links, 'portfolio'),
          name: input.registryName,
        },
      }),
    () => null
  )
}

export const projectAgentSurface = (input: AgentSurfaceInput): AgentSurfaceProjection => {
  const links = linksFrom(input.manifest)
  const canonicalUrl = canonicalFor(hrefFor(links, 'portfolio'), routePaths[input.route])

  return {
    routeId: routeIds[input.route],
    schemaVersion: manifestIsUsable(input.manifest)
      ? (input.manifest?.schemaVersion ?? null)
      : null,
    robotsPolicy: input.route === 'lostSignal' ? 'noindex,follow' : 'index,follow',
    canonicalUrl,
    manifestUrl: hrefFor(links, 'self'),
    dataAuthorityUrl: hrefFor(links, 'authoritative-data'),
    documentationUrl: hrefFor(links, 'documentation'),
    sourceUrl: hrefFor(links, 'source'),
    structuredData: structuredDataFor(input, canonicalUrl),
  }
}
