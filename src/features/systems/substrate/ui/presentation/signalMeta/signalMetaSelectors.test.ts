import type { SignalMetaPresentation } from '../../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeAgentManifestPresentation } from '../../../../../components/substrate/kernel/api/presentation/presentationTypes'
import { selectSignalMetaViewModel } from './signalMetaSelectors'

const metadata: SignalMetaPresentation = {
  registryName: 'Registry',
  titleSuffix: ' · Registry',
  defaultDescription: 'Registry description.',
  routes: {
    ingress: { title: 'Ingress', description: 'Ingress signal.' },
    nexus: { title: 'Nexus', description: 'Nexus signal.' },
    dossier: { title: 'Dossier', description: 'Dossier signal.' },
    missions: { title: 'Missions', description: 'Missions signal.' },
    telemetry: { title: 'Telemetry', description: 'Telemetry signal.' },
    lostSignal: { title: 'Lost Signal', description: 'Missing signal.' },
  },
}

const agentManifest: RuntimeAgentManifestPresentation = {
  schemaVersion: '1.0.0',
  kind: 'public-api-manifest',
  service: 'api.sdin.dev',
  description: 'Public registry resources.',
  canonicalBaseUrl: 'https://api.sdin.dev',
  links: [
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
  ],
  usage: {
    readOnly: true,
    authentication: 'none',
    responseMediaType: 'application/json',
    rateLimitHeaders: ['RateLimit-Limit'],
  },
}

describe('signal metadata selector', () => {
  it('joins API-authored document metadata and manifest links', () => {
    expect(selectSignalMetaViewModel({ metadata, agentManifest }, 'nexus')).toMatchObject(
      {
        fullTitle: 'Nexus · Registry',
        description: 'Nexus signal.',
        routeId: 'portfolio:nexus',
        schemaVersion: '1.0.0',
        canonicalUrl: 'https://portfolio.sdin.dev/nexus',
        manifestUrl: 'https://api.sdin.dev/agent-manifest',
        robotsPolicy: 'index,follow',
      }
    )
  })

  it('does not invent canonical or provenance links before manifest authority arrives', () => {
    expect(
      selectSignalMetaViewModel({ metadata, agentManifest: undefined }, 'nexus')
    ).toMatchObject({
      routeId: 'portfolio:nexus',
      canonicalUrl: null,
      manifestUrl: null,
      dataAuthorityUrl: null,
      structuredData: null,
    })
  })
})
