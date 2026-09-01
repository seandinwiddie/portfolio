import { projectAgentSurface } from './agentSurfaceSelectors'

const links = [
  { rel: 'portfolio', href: 'https://portfolio.sdin.dev', type: 'text/html' },
  {
    rel: 'self',
    href: 'https://api.sdin.dev/agent-manifest',
    type: 'application/json',
  },
  {
    rel: 'authoritative-data',
    href: 'https://api.sdin.dev/data',
    type: 'application/json',
  },
  {
    rel: 'documentation',
    href: 'https://github.com/seandinwiddie/api.sdin.dev/blob/main/README.md',
    type: 'text/markdown',
  },
  {
    rel: 'source',
    href: 'https://github.com/seandinwiddie/api.sdin.dev',
    type: 'text/html',
  },
] as const

const manifest = {
  schemaVersion: '1.0.0',
  kind: 'public-api-manifest',
  service: 'api.sdin.dev',
  description: 'Public registry resources.',
  canonicalBaseUrl: 'https://api.sdin.dev',
  links,
  usage: {
    readOnly: true,
    authentication: 'none',
    responseMediaType: 'application/json',
    rateLimitHeaders: ['RateLimit-Limit'],
  },
} as const

describe('agent surface projection', () => {
  it('projects a stable route identity and API-authored canonical provenance', () => {
    const projection = projectAgentSurface({
      route: 'telemetry',
      fullTitle: 'Telemetry · Orbital Registry',
      description: 'Inspect live system state.',
      registryName: 'Orbital Registry',
      manifest,
    })

    expect(projection).toMatchObject({
      routeId: 'portfolio:telemetry',
      schemaVersion: '1.0.0',
      robotsPolicy: 'index,follow',
      canonicalUrl: 'https://portfolio.sdin.dev/telemetry',
      manifestUrl: 'https://api.sdin.dev/agent-manifest',
      dataAuthorityUrl: 'https://api.sdin.dev/data',
    })
    expect(JSON.parse(projection.structuredData ?? '')).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: 'https://portfolio.sdin.dev/telemetry',
      name: 'Telemetry · Orbital Registry',
    })
  })

  it('keeps the lost-signal document out of the index', () => {
    const projection = projectAgentSurface({
      route: 'lostSignal',
      fullTitle: 'Lost Signal · Orbital Registry',
      description: 'Unavailable coordinate.',
      registryName: 'Orbital Registry',
      manifest,
    })

    expect(projection).toMatchObject({
      routeId: 'portfolio:lost-signal',
      robotsPolicy: 'noindex,follow',
      canonicalUrl: null,
      structuredData: null,
    })
  })

  it('escapes markup delimiters before embedding API text in JSON-LD', () => {
    const projection = projectAgentSurface({
      route: 'nexus',
      fullTitle: 'Nexus',
      description: '</script><script>alert(1)</script>',
      registryName: 'Orbital Registry',
      manifest,
    })

    expect(projection.structuredData).not.toContain('<')
    expect(JSON.parse(projection.structuredData ?? '').description).toBe(
      '</script><script>alert(1)</script>'
    )
  })

  it('fails closed when a manifest loses its read-only contract', () => {
    const projection = projectAgentSurface({
      route: 'nexus',
      fullTitle: 'Nexus',
      description: 'Nexus signal.',
      registryName: 'Orbital Registry',
      manifest: {
        ...manifest,
        usage: { ...manifest.usage, readOnly: false },
      },
    })

    expect(projection).toMatchObject({
      routeId: 'portfolio:nexus',
      schemaVersion: null,
      canonicalUrl: null,
      manifestUrl: null,
      sourceUrl: null,
      structuredData: null,
    })
  })
})
