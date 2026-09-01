#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  indexableRoutesFrom,
  htmlFileForRoute,
  manifestIssues,
  presentationMetadataIssues,
  renderLlms,
  renderRobots,
  renderSitemap,
  renderStaticDocument,
  routeSetIssues,
  staticDocumentIssues,
} from './agent-surface.mjs'

const outputDirectory = path.resolve(process.argv[2] ?? 'dist')
const manifestUrl =
  process.env.PORTFOLIO_AGENT_MANIFEST_URL ?? 'https://api.sdin.dev/agent-manifest'

const requireSuccessfulResponse = (response) =>
  response.ok
    ? response
    : Promise.reject(`agent manifest returned HTTP ${response.status}`)

const requireValidManifest = (manifest) => {
  const issues = manifestIssues(manifest)
  return issues.length === 0
    ? manifest
    : Promise.reject(`agent manifest contract failed: ${issues.join(', ')}`)
}

const requireValidPresentation = (document) => {
  const issues = presentationMetadataIssues(document)
  return issues.length === 0
    ? document.presentation.metadata
    : Promise.reject(`presentation metadata contract failed: ${issues.join(', ')}`)
}

const writeArtifact = (name, content) =>
  writeFile(path.join(outputDirectory, name), content, 'utf8')

const fetchJson = (url) =>
  fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  })
    .then(requireSuccessfulResponse)
    .then((response) => response.json())

const requireExpectedRoutes = (routes) => {
  const issues = routeSetIssues(routes)
  return issues.length === 0
    ? routes
    : Promise.reject(`static route contract failed: ${issues.join(', ')}`)
}

const enhanceStaticDocument = (manifest, metadata, route) => {
  const fileName = htmlFileForRoute(route)
  const filePath = path.join(outputDirectory, fileName)
  return readFile(filePath, 'utf8').then((html) => {
    const issues = staticDocumentIssues(html, route)
    return issues.length === 0
      ? writeFile(filePath, renderStaticDocument(html, manifest, metadata, route), 'utf8')
      : Promise.reject(`static document ${fileName} failed: ${issues.join(', ')}`)
  })
}

const generate = async () => {
  const [response, fileNames] = await Promise.all([
    fetch(manifestUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    }).then(requireSuccessfulResponse),
    readdir(outputDirectory),
  ])
  const manifest = await response.json().then(requireValidManifest)
  const routes = requireExpectedRoutes(indexableRoutesFrom(fileNames))
  const metadata = await fetchJson(
    manifest.links.find(({ rel }) => rel === 'authoritative-data').href
  ).then(requireValidPresentation)

  await Promise.all([
    writeArtifact('robots.txt', renderRobots(manifest)),
    writeArtifact('sitemap.xml', renderSitemap(manifest, routes)),
    writeArtifact('llms.txt', renderLlms(manifest, routes)),
    ...routes.map((route) => enhanceStaticDocument(manifest, metadata, route)),
  ])

  console.info(
    `[ok] agent discovery surface: ${routes.length} interface routes · schema ${manifest.schemaVersion}`
  )
}

generate().catch((reason) => {
  console.error(`[fail] agent discovery surface: ${String(reason)}`)
  process.exitCode = 1
})
