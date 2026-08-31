#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { domainKeyFor } from './concern-tree.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const featuresRoot = path.join(projectRoot, 'src', 'features')
const typeScriptExtensions = new Set(['.ts', '.tsx'])
const roleSuffix =
  /(?:Api|Slice|Types?|Reducers?|Listeners?|Actions?|Select(?:e|o)rs?|Thunks?|Adapters?)$/u

const toPosix = (filePath) => filePath.split(path.sep).join('/')
const relativeToProject = (filePath) => toPosix(path.relative(projectRoot, filePath))
const isTypeScriptFile = (filePath) => typeScriptExtensions.has(path.extname(filePath))
const fileStem = (filePath) =>
  path.basename(filePath, path.extname(filePath)).replace(/\.test$/u, '')

const featureFilesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name)
    return entry.isDirectory()
      ? featureFilesUnder(filePath)
      : isTypeScriptFile(filePath)
        ? [filePath]
        : []
  })

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
const lowerFirst = (value) => value.slice(0, 1).toLowerCase() + value.slice(1)
const isTestFile = (filePath) => path.basename(filePath).includes('.test.')

export const prefixViolation = (filePath) => {
  const expectedPrefix = path.basename(path.dirname(filePath))
  const exactPrefix = new RegExp(`^${escapePattern(expectedPrefix)}(?:[A-Z]|$)`, 'u')
  return exactPrefix.test(fileStem(filePath))
    ? []
    : [
        `[fail] FEATURE-FILE-001 ${relativeToProject(filePath)} must begin with its immediate folder prefix "${expectedPrefix}"`,
      ]
}

export const suffixViolation = (filePath) =>
  roleSuffix.test(fileStem(filePath))
    ? []
    : [
        `[fail] FEATURE-FILE-002 ${relativeToProject(filePath)} must end with an approved architectural role suffix`,
      ]

// A subdomain split lives in its own folder, not a concatenated sibling filename:
// `map/route/routeSelectors.ts`, never `map/mapRouteSelectors.ts`. A role file
// whose stem carries extra words between its immediate folder prefix and its role
// suffix is an un-nested subdomain — the words name a subdomain that should be a
// folder. The canonical domain file (stem === folder + suffix) and files already
// living in their subdomain folder (stem === folder + suffix) are unaffected.
export const nestingViolation = (filePath) => {
  const folder = path.basename(path.dirname(filePath))
  const stem = fileStem(filePath)
  const suffixMatch = stem.match(roleSuffix)
  if (!suffixMatch) return []
  const suffix = suffixMatch[0]
  const core = stem.slice(0, stem.length - suffix.length)
  const carriesSubdomain =
    core.length > folder.length &&
    core.slice(0, folder.length) === folder &&
    /[A-Z]/u.test(core.charAt(folder.length))
  if (!carriesSubdomain) return []
  const subdomain = lowerFirst(core.slice(folder.length))
  const suggested = [
    path.dirname(relativeToProject(filePath)),
    subdomain,
    `${subdomain}${suffix}${isTestFile(filePath) ? '.test' : ''}${path.extname(filePath)}`,
  ].join('/')
  return [
    `[fail] FEATURE-FILE-003 ${relativeToProject(filePath)} concatenates subdomain "${core.slice(folder.length)}" into its filename; nest it as ${suggested} — name the subdomain folder for the concern it owns (a semantic name, not a generic or positional one)`,
  ]
}

export const validateFeatureFile = (filePath) => [
  ...prefixViolation(filePath),
  ...suffixViolation(filePath),
  ...nestingViolation(filePath),
]

// A subdomain folder name must be unique WITHIN its domain: the same subdomain name at two
// different paths under one domain is ambiguous, so a second split reusing a name must be
// given a unique one. The domain is resolved through the canonical concern tree (pillar →
// branch → domain), so the concern-branch scaffolding above a domain is never mistaken for a
// subdomain, and different domains may legitimately reuse a split name — `crafting/item/catalog`
// and `ecology/geography/room/catalog` do not collide because uniqueness is scoped to the domain.
export const subdomainCollisionViolations = (files) => {
  const dirsByKey = new Map()
  files.forEach((filePath) => {
    const rel = relativeToProject(filePath)
    const resolved = domainKeyFor(rel)
    if (!resolved) return
    const segments = rel.split('/')
    segments.slice(resolved.subdomainStart, -1).forEach((name, index) => {
      const dir = segments.slice(0, resolved.subdomainStart + index + 1).join('/')
      const key = `${resolved.domainKey}::${name}`
      const dirs = dirsByKey.get(key) ?? new Set()
      dirs.add(dir)
      dirsByKey.set(key, dirs)
    })
  })
  return [...dirsByKey.entries()]
    .filter(([, dirs]) => dirs.size > 1)
    .map(([key, dirs]) => {
      const [domain, name] = key.split('::')
      return `[fail] FEATURE-FILE-004 subdomain "${name}" appears at more than one path within domain "${domain}" (${[...dirs].sort().join(', ')}); give each split a unique subdomain name`
    })
}

// A re-export barrel (`export { … } from './sub/…'`, `export * from …`) is a legitimate
// TRANSITIONAL surface after a subdomain split, but it is indirection that should decay:
// importers ought to wire directly to the subdomain module so the barrel can be deleted.
// This is a non-blocking suggestion, not a violation — it nudges barrels to phase out
// over time rather than becoming permanent.
const reExportLine = /^\s*export\s+(?:\*|type\s+\{[^}]*\}|\{[^}]*\})\s+from\s+['"]/mu

export const isReExportBarrel = (text) => reExportLine.test(text)

export const barrelSuggestions = (files) =>
  files
    .filter((filePath) => isReExportBarrel(readFileSync(filePath, 'utf8')))
    .map(
      (filePath) =>
        `[suggest] FEATURE-FILE-005 ${relativeToProject(filePath)} is a re-export barrel; wire importers directly to the subdomain modules so this transitional barrel decays and can be removed`
    )

export const runFeatureFileContract = () => {
  if (!existsSync(featuresRoot)) {
    console.error(`[fail] FEATURE-FILE-000 missing ${relativeToProject(featuresRoot)}`)
    return 1
  }
  const files = featureFilesUnder(featuresRoot).sort()
  const violations = [
    ...files.flatMap(validateFeatureFile),
    ...subdomainCollisionViolations(files),
  ]

  console.log('[check] src/features filename contract')
  console.log(`[path] features: ${relativeToProject(featuresRoot)}`)

  violations.forEach((violation) => console.error(violation))

  const suggestions = barrelSuggestions(files)
  suggestions.forEach((suggestion) => console.log(suggestion))

  console.log(`[info] checked ${files.length} TypeScript feature files`)
  console.log(`[info] found ${violations.length} filename contract violation(s)`)
  console.log(
    `[info] ${suggestions.length} re-export barrel(s) to phase out toward direct wiring`
  )
  return Number(violations.length > 0)
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invokedDirectly) process.exitCode = runFeatureFileContract()
