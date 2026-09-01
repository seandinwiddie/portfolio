const XML_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const excludedHtml = ['+not-found.html', '404.html', '_sitemap.html']
const expectedRoutes = ['/', '/dossier', '/missions', '/nexus', '/telemetry']
const expectedManifestService = 'api.sdin.dev'
const expectedManifestOrigin = 'https://api.sdin.dev'
const expectedPortfolioOrigin = 'https://portfolio.sdin.dev'
const requiredLinkContracts = {
  self: { href: `${expectedManifestOrigin}/agent-manifest`, type: 'application/json' },
  portfolio: { href: expectedPortfolioOrigin, type: 'text/html' },
  'authoritative-data': {
    href: `${expectedManifestOrigin}/data`,
    type: 'application/json',
  },
  documentation: { type: 'text/markdown' },
  source: { type: 'text/html' },
}
const routeKeys = {
  '/': 'ingress',
  '/dossier': 'dossier',
  '/missions': 'missions',
  '/nexus': 'nexus',
  '/telemetry': 'telemetry',
}
const unsafeResourcePattern =
  /(?:private|credential|secret|raw-(?:finding|evidence)|scan-target|scanner-rule|assessment-(?:detail|record)|target-(?:tuple|url))/iu
const staticHeadStart = '<!-- sdin-agent-surface:start -->'
const staticHeadEnd = '<!-- sdin-agent-surface:end -->'
const staticHeadPattern =
  /<!-- sdin-agent-surface:start -->.*?<!-- sdin-agent-surface:end -->/su

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const linkFor = (manifest, rel) => manifest.links.find((link) => link.rel === rel) ?? null

const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const isCanonicalHttpsOrigin = (value) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && parsed.origin === value
  } catch {
    return false
  }
}

const escapeXml = (value) =>
  String(value)
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;')

const htmlRouteFor = (fileName) =>
  fileName === 'index.html' ? '/' : `/${fileName.replace(/\.html$/u, '')}`

const routeIdFor = (route) =>
  route === '/' ? 'portfolio:ingress' : `portfolio:${route.slice(1)}`

const routeSortKey = (route) => (route === '/' ? '' : route)

const canonicalUrlFor = (origin, route) => `${origin.replace(/\/+$/u, '')}${route}`

const fullTitleFor = (metadata, routeKey) => {
  const title = metadata.routes[routeKey].title
  return title ? `${title}${metadata.titleSuffix}` : metadata.registryName
}

const escapeJsonForHtml = (value) =>
  JSON.stringify(value)
    .replace(/</gu, '\\u003c')
    .replace(/>/gu, '\\u003e')
    .replace(/&/gu, '\\u0026')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029')

export const manifestIssues = (manifest) => {
  const links = Array.isArray(manifest?.links) ? manifest.links : []
  const resources = Array.isArray(manifest?.resources) ? manifest.resources : []
  const rels = links.map(({ rel }) => rel)
  const resourceIds = resources.map(({ id }) => id)

  return [
    ...(isObject(manifest) ? [] : ['manifest-object']),
    ...(manifest?.kind === 'public-api-manifest' ? [] : ['manifest-kind']),
    ...(/^\d+\.\d+\.\d+$/u.test(manifest?.schemaVersion ?? '')
      ? []
      : ['manifest-schema-version']),
    ...(manifest?.service === expectedManifestService ? [] : ['manifest-service']),
    ...(nonEmptyString(manifest?.description) ? [] : ['manifest-description']),
    ...(manifest?.canonicalBaseUrl === expectedManifestOrigin &&
    isCanonicalHttpsOrigin(manifest.canonicalBaseUrl)
      ? []
      : ['manifest-canonical-base-url']),
    ...(manifest?.usage?.readOnly === true ? [] : ['manifest-read-only']),
    ...(manifest?.usage?.authentication === 'none' ? [] : ['manifest-authentication']),
    ...(manifest?.usage?.responseMediaType === 'application/json'
      ? []
      : ['manifest-response-media-type']),
    ...(Array.isArray(manifest?.usage?.rateLimitHeaders) &&
    manifest.usage.rateLimitHeaders.length > 0
      ? []
      : ['manifest-rate-limit-headers']),
    ...(manifest?.provenance?.authority === '/data'
      ? []
      : ['manifest-provenance-authority']),
    ...(manifest?.provenance?.catalogPath === '/data#presentation.runtime.resourceCatalog'
      ? []
      : ['manifest-provenance-catalog']),
    ...(resources.length > 0 ? [] : ['manifest-resources']),
    ...['self', 'portfolio', 'authoritative-data', 'documentation', 'source']
      .filter((rel) => !rels.includes(rel))
      .map((rel) => `manifest-link-${rel}`),
    ...Object.entries(requiredLinkContracts).flatMap(([rel, contract]) => {
      const link = links.find((candidate) => candidate?.rel === rel)
      return [
        ...(link === undefined ||
        contract.href === undefined ||
        link.href === contract.href
          ? []
          : [`manifest-link-${rel}-href`]),
        ...(link === undefined || link.type === contract.type
          ? []
          : [`manifest-link-${rel}-type`]),
      ]
    }),
    ...(new Set(rels).size === rels.length ? [] : ['manifest-links-unique']),
    ...links.flatMap((link, index) => [
      ...(nonEmptyString(link?.rel) ? [] : [`manifest-link-${index}-rel`]),
      ...(nonEmptyString(link?.type) ? [] : [`manifest-link-${index}-type`]),
      ...(isHttpsUrl(link?.href) ? [] : [`manifest-link-${index}-https`]),
      ...(unsafeResourcePattern.test(`${link?.rel ?? ''} ${link?.href ?? ''}`)
        ? [`manifest-link-${index}-private-surface`]
        : []),
    ]),
    ...resourceIds
      .filter((id, index, identifiers) => identifiers.indexOf(id) !== index)
      .map((id) => `manifest-resource-${id}-duplicate`),
    ...resources.flatMap((resource, index) => [
      ...(/^[a-z][a-z0-9-]*$/u.test(resource?.id ?? '')
        ? []
        : [`manifest-resource-${index}-id`]),
      ...(resource?.method === 'GET' ? [] : [`manifest-resource-${index}-read-only`]),
      ...(resource?.mediaType === 'application/json'
        ? []
        : [`manifest-resource-${index}-media-type`]),
      ...(isHttpsUrl(resource?.href) ? [] : [`manifest-resource-${index}-https`]),
      ...(typeof resource?.path === 'string' && resource.path.startsWith('/')
        ? []
        : [`manifest-resource-${index}-path`]),
      ...(resource?.rel === resource?.id ? [] : [`manifest-resource-${index}-rel`]),
      ...(isCanonicalHttpsOrigin(manifest?.canonicalBaseUrl) &&
      typeof resource?.path === 'string' &&
      resource?.href === new URL(resource.path, manifest.canonicalBaseUrl).href
        ? []
        : [`manifest-resource-${index}-authority`]),
      ...(unsafeResourcePattern.test(
        `${resource?.id ?? ''} ${resource?.domain ?? ''} ${resource?.href ?? ''}`
      )
        ? [`manifest-resource-${index}-private-surface`]
        : []),
    ]),
  ]
}

export const presentationMetadataIssues = (document) => {
  const metadata = document?.presentation?.metadata
  const routes = metadata?.routes
  return [
    ...(isObject(metadata) ? [] : ['metadata-object']),
    ...(nonEmptyString(metadata?.registryName) ? [] : ['metadata-registry-name']),
    ...(typeof metadata?.titleSuffix === 'string' ? [] : ['metadata-title-suffix']),
    ...(nonEmptyString(metadata?.defaultDescription)
      ? []
      : ['metadata-default-description']),
    ...(isObject(routes) ? [] : ['metadata-routes']),
    ...Object.values(routeKeys).flatMap((routeKey) => [
      ...(nonEmptyString(routes?.[routeKey]?.title)
        ? []
        : [`metadata-route-${routeKey}-title`]),
      ...(nonEmptyString(routes?.[routeKey]?.description)
        ? []
        : [`metadata-route-${routeKey}-description`]),
    ]),
  ]
}

export const indexableRoutesFrom = (fileNames) =>
  fileNames
    .filter((fileName) => fileName.endsWith('.html') && !excludedHtml.includes(fileName))
    .map(htmlRouteFor)
    .sort((left, right) => routeSortKey(left).localeCompare(routeSortKey(right)))

export const routeSetIssues = (routes) =>
  routes.length === expectedRoutes.length &&
  expectedRoutes.every((route, index) => routes[index] === route)
    ? []
    : [`interface-routes:${routes.join(',')}`]

export const staticDocumentIssues = (html, route) => [
  ...(html.includes('</head>') ? [] : ['document-head']),
  ...(/<title data-rh="true">[^<]*<\/title>/u.test(html) ? [] : ['document-title']),
  ...(html.includes('name="description"') ? [] : ['document-description']),
  ...(html.includes('property="og:title"') ? [] : ['document-og-title']),
  ...(html.includes('property="og:description"') ? [] : ['document-og-description']),
  ...(html.includes(`name="sdin:route-id" content="${routeIdFor(route)}"`)
    ? []
    : ['document-route-id']),
  ...(html.includes('name="robots" content="index,follow"') ? [] : ['document-robots']),
]

export const renderRobots = (manifest) => {
  const origin = linkFor(manifest, 'portfolio').href.replace(/\/+$/u, '')
  return [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${origin}/sitemap.xml`,
    `# Agent manifest: ${linkFor(manifest, 'self').href}`,
    '',
  ].join('\n')
}

export const renderSitemap = (manifest, routes) => {
  const origin = linkFor(manifest, 'portfolio').href
  const entries = routes
    .map(
      (route) => `  <url><loc>${escapeXml(canonicalUrlFor(origin, route))}</loc></url>`
    )
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${XML_NAMESPACE}">`,
    entries,
    '</urlset>',
    '',
  ].join('\n')
}

const linkLine = (link) => `- [${link.rel}](${link.href}): ${link.type}`

const routeLine = (origin) => (route) =>
  `- [${routeIdFor(route)}](${canonicalUrlFor(origin, route)})`

const resourceLine = (resource) =>
  `- [${resource.id}](${resource.href}): ${resource.method} ${resource.mediaType}; domain=${resource.domain}`

export const renderLlms = (manifest, routes) => {
  const origin = linkFor(manifest, 'portfolio').href
  const hostname = origin.replace(/^https:\/\//u, '').split('/')[0]
  return [
    `# ${hostname}`,
    '',
    `> ${manifest.description}`,
    '',
    `Manifest schema: ${manifest.schemaVersion}`,
    `Observed authority: ${manifest.provenance.authority}`,
    `Catalog provenance: ${manifest.provenance.catalogPath}`,
    `Access: public, read-only, JSON; honor ${manifest.usage.rateLimitHeaders.join(', ')}.`,
    '',
    '## Discovery',
    '',
    ...manifest.links.map(linkLine),
    '',
    '## Interface routes',
    '',
    ...routes.map(routeLine(origin)),
    '',
    '## Public API resources',
    '',
    ...manifest.resources.map(resourceLine),
    '',
  ].join('\n')
}

const staticHeadFor = (manifest, metadata, route) => {
  const routeKey = routeKeys[route]
  const canonicalUrl = canonicalUrlFor(linkFor(manifest, 'portfolio').href, route)
  const manifestUrl = linkFor(manifest, 'self').href
  const dataAuthorityUrl = linkFor(manifest, 'authoritative-data').href
  const documentationUrl = linkFor(manifest, 'documentation').href
  const sourceUrl = linkFor(manifest, 'source').href
  const fullTitle = fullTitleFor(metadata, routeKey)
  const description = metadata.routes[routeKey].description
  const structuredData = escapeJsonForHtml({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: fullTitle,
    description,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${linkFor(manifest, 'portfolio').href}#website`,
      url: linkFor(manifest, 'portfolio').href,
      name: metadata.registryName,
    },
  })

  return {
    fullTitle,
    description,
    fragment: [
      staticHeadStart,
      `<meta data-rh="true" name="sdin:manifest-schema" content="${escapeXml(manifest.schemaVersion)}"/>`,
      `<link data-rh="true" rel="canonical" href="${escapeXml(canonicalUrl)}"/>`,
      `<meta data-rh="true" property="og:url" content="${escapeXml(canonicalUrl)}"/>`,
      `<link data-rh="true" rel="alternate" type="application/json" href="${escapeXml(manifestUrl)}"/>`,
      `<meta data-rh="true" name="sdin:agent-manifest" content="${escapeXml(manifestUrl)}"/>`,
      `<meta data-rh="true" name="sdin:data-authority" content="${escapeXml(dataAuthorityUrl)}"/>`,
      `<meta data-rh="true" name="sdin:documentation" content="${escapeXml(documentationUrl)}"/>`,
      `<meta data-rh="true" name="sdin:source" content="${escapeXml(sourceUrl)}"/>`,
      `<script data-sdin-agent-surface="static" type="application/ld+json">${structuredData}</script>`,
      staticHeadEnd,
    ].join(''),
  }
}

const replaceMetadataContent = (html, name, content) =>
  html.replace(
    new RegExp(`<meta data-rh="true" name="${name}" content="[^"]*"\\/>`, 'u'),
    `<meta data-rh="true" name="${name}" content="${escapeXml(content)}"/>`
  )

const replacePropertyContent = (html, property, content) =>
  html.replace(
    new RegExp(`<meta data-rh="true" property="${property}" content="[^"]*"\\/>`, 'u'),
    `<meta data-rh="true" property="${property}" content="${escapeXml(content)}"/>`
  )

export const renderStaticDocument = (html, manifest, metadata, route) => {
  const head = staticHeadFor(manifest, metadata, route)
  const document = html.replace(staticHeadPattern, '')
  return replacePropertyContent(
    replacePropertyContent(
      replaceMetadataContent(
        document.replace(
          /<title data-rh="true">[^<]*<\/title>/u,
          `<title data-rh="true">${escapeXml(head.fullTitle)}</title>`
        ),
        'description',
        head.description
      ),
      'og:title',
      head.fullTitle
    ),
    'og:description',
    head.description
  ).replace('</head>', `${head.fragment}</head>`)
}

export const htmlFileForRoute = (route) =>
  route === '/' ? 'index.html' : `${route.slice(1)}.html`
