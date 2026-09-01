import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  htmlFileForRoute,
  indexableRoutesFrom,
  manifestIssues,
  presentationMetadataIssues,
  renderLlms,
  renderRobots,
  renderSitemap,
  renderStaticDocument,
  routeSetIssues,
  staticDocumentIssues,
} from './agent-surface.mjs'

const manifest = {
  schemaVersion: '1.0.0',
  kind: 'public-api-manifest',
  description: 'API-authored public registry.',
  service: 'api.sdin.dev',
  canonicalBaseUrl: 'https://api.sdin.dev',
  provenance: {
    authority: '/data',
    catalogPath: '/data#presentation.runtime.resourceCatalog',
  },
  usage: {
    readOnly: true,
    authentication: 'none',
    responseMediaType: 'application/json',
    rateLimitHeaders: ['RateLimit-Limit'],
  },
  links: [
    {
      rel: 'self',
      href: 'https://api.sdin.dev/agent-manifest',
      type: 'application/json',
    },
    { rel: 'portfolio', href: 'https://portfolio.sdin.dev', type: 'text/html' },
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
  resources: [
    {
      id: 'authored-document',
      rel: 'authored-document',
      href: 'https://api.sdin.dev/data',
      path: '/data',
      method: 'GET',
      mediaType: 'application/json',
      domain: 'registry',
    },
  ],
}

const authoredDocument = {
  presentation: {
    metadata: {
      registryName: 'Sean Dinwiddie — Orbital Registry',
      titleSuffix: ' — Sean Dinwiddie',
      defaultDescription: 'API-authored portfolio metadata.',
      routes: {
        ingress: { title: 'Ingress', description: 'Enter the registry.' },
        dossier: { title: 'Dossier', description: 'Review the record.' },
        missions: { title: 'Missions', description: 'Review active missions.' },
        nexus: { title: 'Nexus', description: 'Inspect active signals.' },
        telemetry: { title: 'Telemetry', description: 'Inspect live state.' },
      },
    },
  },
}

test('manifest validation accumulates independent contract failures', () => {
  assert.deepEqual(manifestIssues({}), [
    'manifest-kind',
    'manifest-schema-version',
    'manifest-service',
    'manifest-description',
    'manifest-canonical-base-url',
    'manifest-read-only',
    'manifest-authentication',
    'manifest-response-media-type',
    'manifest-rate-limit-headers',
    'manifest-provenance-authority',
    'manifest-provenance-catalog',
    'manifest-resources',
    'manifest-link-self',
    'manifest-link-portfolio',
    'manifest-link-authoritative-data',
    'manifest-link-documentation',
    'manifest-link-source',
  ])
  assert.deepEqual(manifestIssues(manifest), [])
})

test('presentation metadata validation keeps static document copy API-authored', () => {
  assert.deepEqual(presentationMetadataIssues(authoredDocument), [])
  assert.deepEqual(presentationMetadataIssues({}), [
    'metadata-object',
    'metadata-registry-name',
    'metadata-title-suffix',
    'metadata-default-description',
    'metadata-routes',
    'metadata-route-ingress-title',
    'metadata-route-ingress-description',
    'metadata-route-dossier-title',
    'metadata-route-dossier-description',
    'metadata-route-missions-title',
    'metadata-route-missions-description',
    'metadata-route-nexus-title',
    'metadata-route-nexus-description',
    'metadata-route-telemetry-title',
    'metadata-route-telemetry-description',
  ])
})

test('route discovery follows exported HTML and excludes error/internal artifacts', () => {
  assert.deepEqual(
    indexableRoutesFrom([
      'telemetry.html',
      '+not-found.html',
      'index.html',
      '_sitemap.html',
      '404.html',
      'nexus.html',
      'dossier.html',
      'missions.html',
      'entry.js',
    ]),
    ['/', '/dossier', '/missions', '/nexus', '/telemetry']
  )
  assert.deepEqual(
    routeSetIssues(['/', '/dossier', '/missions', '/nexus', '/telemetry']),
    []
  )
  assert.deepEqual(routeSetIssues(['/', '/nexus']), ['interface-routes:/,/nexus'])
  assert.equal(htmlFileForRoute('/'), 'index.html')
  assert.equal(htmlFileForRoute('/telemetry'), 'telemetry.html')
})

test('manifest validation rejects mutation and private security resources', () => {
  const unsafeManifest = {
    ...manifest,
    resources: [
      ...manifest.resources,
      {
        id: 'raw-findings',
        rel: 'raw-findings',
        href: 'https://api.sdin.dev/private/raw-findings',
        path: '/private/raw-findings',
        method: 'POST',
        mediaType: 'application/json',
        domain: 'private-security',
      },
    ],
  }

  assert.deepEqual(manifestIssues(unsafeManifest), [
    'manifest-resource-1-read-only',
    'manifest-resource-1-private-surface',
  ])
})

test('generated discovery artifacts share canonical absolute routes and authority', () => {
  const routes = ['/', '/nexus']
  const robots = renderRobots(manifest)
  const sitemap = renderSitemap(manifest, routes)
  const llms = renderLlms(manifest, routes)

  assert.match(robots, /Sitemap: https:\/\/portfolio\.sdin\.dev\/sitemap\.xml/u)
  assert.match(sitemap, /<loc>https:\/\/portfolio\.sdin\.dev\/nexus<\/loc>/u)
  assert.match(llms, /\[portfolio:nexus\]\(https:\/\/portfolio\.sdin\.dev\/nexus\)/u)
  assert.match(llms, /\[authored-document\]\(https:\/\/api\.sdin\.dev\/data\)/u)
  assert.doesNotMatch(llms, /private|credential|finding-detail/iu)
})

test('static HTML receives canonical API provenance and API-authored JSON-LD', () => {
  const html = [
    '<html><head>',
    '<title data-rh="true">Local fallback</title>',
    '<meta data-rh="true" name="description" content="Local fallback"/>',
    '<meta data-rh="true" name="robots" content="index,follow"/>',
    '<meta data-rh="true" name="sdin:route-id" content="portfolio:nexus"/>',
    '<meta data-rh="true" property="og:title" content="Local fallback"/>',
    '<meta data-rh="true" property="og:description" content="Local fallback"/>',
    '</head><body></body></html>',
  ].join('')
  const metadata = {
    ...authoredDocument.presentation.metadata,
    routes: {
      ...authoredDocument.presentation.metadata.routes,
      nexus: {
        title: 'Nexus',
        description: '</script><script>not executable</script>',
      },
    },
  }
  const rendered = renderStaticDocument(html, manifest, metadata, '/nexus')
  const rerendered = renderStaticDocument(rendered, manifest, metadata, '/nexus')

  assert.deepEqual(staticDocumentIssues(html, '/nexus'), [])
  assert.deepEqual(staticDocumentIssues('<html></html>', '/nexus'), [
    'document-head',
    'document-title',
    'document-description',
    'document-og-title',
    'document-og-description',
    'document-route-id',
    'document-robots',
  ])
  assert.match(rendered, /<title data-rh="true">Nexus — Sean Dinwiddie<\/title>/u)
  assert.match(rendered, /rel="canonical" href="https:\/\/portfolio\.sdin\.dev\/nexus"/u)
  assert.match(rendered, /name="sdin:manifest-schema" content="1\.0\.0"/u)
  assert.match(rendered, /type="application\/ld\+json"/u)
  assert.doesNotMatch(rendered, /<script>not executable<\/script>/u)
  assert.match(rendered, /\\u003c\/script\\u003e/u)
  assert.equal(rerendered.match(/<!-- sdin-agent-surface:start -->/gu)?.length, 1)
})
