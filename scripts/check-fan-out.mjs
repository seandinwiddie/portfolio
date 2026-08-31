#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CONCERN_TREE, VIEW_TREE } from './concern-tree.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_SUBNODES = 7
const SWEET_SPOT = 5
const FEATURE_BUCKETS = [
  'src/features/components',
  'src/features/entities',
  'src/features/systems',
]

const subdirs = (relativePath) => {
  const absolutePath = path.join(projectRoot, relativePath)
  return existsSync(absolutePath)
    ? readdirSync(absolutePath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : []
}

const overBudget = (relativePath) => {
  const children = subdirs(relativePath)
  const finding =
    children.length > MAX_SUBNODES
      ? [`${String(children.length).padStart(3)} direct subnodes: ${relativePath}`]
      : []
  return children.reduce(
    (findings, child) => [...findings, ...overBudget(`${relativePath}/${child}`)],
    finding
  )
}

const unexpected = (relativePath, actual, allowed, label) =>
  actual
    .filter((name) => !allowed.includes(name))
    .map(
      (name) =>
        `${relativePath}/${name} is not a declared ${label} (${allowed.join(', ')})`
    )

const featureStructureViolations = (bucket) => {
  const pillars = Object.keys(CONCERN_TREE)
  return [
    ...unexpected(bucket, subdirs(bucket), pillars, 'portfolio design pillar'),
    ...subdirs(bucket).flatMap((pillar) => {
      const branches = CONCERN_TREE[pillar]
      if (!branches) return []
      const pillarPath = `${bucket}/${pillar}`
      return [
        ...unexpected(
          pillarPath,
          subdirs(pillarPath),
          Object.keys(branches),
          `${pillar} concern branch`
        ),
        ...subdirs(pillarPath).flatMap((branch) => {
          const domains = branches[branch]
          return domains
            ? unexpected(
                `${pillarPath}/${branch}`,
                subdirs(`${pillarPath}/${branch}`),
                domains,
                `${pillar}/${branch} domain`
              )
            : []
        }),
      ]
    }),
  ]
}

const viewStructureViolations = () => {
  const viewsRoot = 'src/views'
  return [
    ...unexpected(
      viewsRoot,
      subdirs(viewsRoot),
      Object.keys(VIEW_TREE),
      'Expo route or presentation root'
    ),
    ...subdirs(viewsRoot).flatMap((root) => {
      const branches = VIEW_TREE[root]
      if (!branches) return []
      const rootPath = `${viewsRoot}/${root}`
      const flatDomains = branches['.']
      if (flatDomains) {
        return unexpected(rootPath, subdirs(rootPath), flatDomains, `${root} view domain`)
      }
      return [
        ...unexpected(
          rootPath,
          subdirs(rootPath),
          Object.keys(branches),
          `${root} view concern branch`
        ),
        ...subdirs(rootPath).flatMap((branch) => {
          const domains = branches[branch]
          return domains
            ? unexpected(
                `${rootPath}/${branch}`,
                subdirs(`${rootPath}/${branch}`),
                domains,
                `${root}/${branch} view domain`
              )
            : []
        }),
      ]
    }),
  ]
}

export const collectFanOutFindings = () => {
  const featureFanOut = FEATURE_BUCKETS.flatMap(overBudget)
  // src/views itself is the Expo route registry and deliberately exceeds the
  // generic budget. Every named route/presentation root beneath it is bounded.
  const viewFanOut = subdirs('src/views').flatMap((root) =>
    overBudget(`src/views/${root}`)
  )
  const structure = [
    ...FEATURE_BUCKETS.flatMap(featureStructureViolations),
    ...viewStructureViolations(),
  ]
  return { fanOut: [...featureFanOut, ...viewFanOut], structure }
}

export const runFanOutCheck = () => {
  const findings = collectFanOutFindings()
  ;[...findings.fanOut, ...findings.structure].forEach((line) => console.error(line))
  const total = findings.fanOut.length + findings.structure.length

  console.log(
    total > 0
      ? `Fan-out check failed: ${findings.fanOut.length} node(s) over the ${MAX_SUBNODES}-subnode budget (aim for ~${SWEET_SPOT}), ${findings.structure.length} off-tree folder(s).`
      : `Fan-out check passed: every owned node holds at most ${MAX_SUBNODES} direct subnodes and the declared portfolio concern tree matches the source tree.`
  )
  return Number(total > 0)
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invokedDirectly) process.exitCode = runFanOutCheck()
