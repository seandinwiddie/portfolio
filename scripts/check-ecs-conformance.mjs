#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const sourceRoot = path.join(projectRoot, 'src')
const featuresRoot = path.join(sourceRoot, 'features')
const viewsRoot = path.join(sourceRoot, 'views')

const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
])
const ignoredDirs = new Set(['__tests__', 'dist', 'node_modules'])
const rootFiles = new Set(['index.ts', 'store.ts'])
const featureDomains = new Set(['components', 'entities', 'systems'])
const roleBucketDirs = new Set([
  'actions',
  'adapters',
  'common',
  'core',
  'lib',
  'listeners',
  'middleware',
  'runtime',
  'selector',
  'selectors',
  'slice',
  'slices',
  'store',
  'thunk',
  'thunks',
  'type',
  'types',
  'utils',
  'view',
  'views',
])

let status = 0

const toPosix = (filePath) => filePath.split(path.sep).join('/')
const relativeToProject = (filePath) => toPosix(path.relative(projectRoot, filePath))
const fail = (ruleId, message) => {
  console.log(`[fail] ${ruleId} ${message}`)
  status = 1
}
const isSourceFile = (filePath) =>
  sourceExtensions.has(path.extname(filePath).toLowerCase())

const walk = (root, onEntry) => {
  if (!fs.existsSync(root)) return
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue
    const fullPath = path.join(root, entry.name)
    onEntry(fullPath, entry)
    if (entry.isDirectory()) walk(fullPath, onEntry)
  }
}

const listImmediate = (directory) =>
  fs.existsSync(directory)
    ? fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => !ignoredDirs.has(entry.name))
    : []

const sourceFilesUnder = (directory) => {
  const files = []
  walk(directory, (filePath, entry) => {
    if (entry.isFile() && isSourceFile(filePath)) files.push(filePath)
  })
  return files.sort()
}

const checkSourcePresence = () => {
  if (!fs.existsSync(sourceRoot)) {
    fail('ECS-SOURCE-001', 'src is missing')
    return
  }
  if (!sourceFilesUnder(sourceRoot).length) {
    fail('ECS-SOURCE-001', 'src has no production source files')
  }
}

const checkRootFiles = () => {
  for (const entry of listImmediate(sourceRoot)) {
    const filePath = path.join(sourceRoot, entry.name)
    if (entry.isFile() && isSourceFile(filePath) && !rootFiles.has(entry.name)) {
      fail(
        'ECS-ROOT-001',
        `${relativeToProject(filePath)} is a root source file; src may only contain ${[...rootFiles].sort().join(', ')}`
      )
    }
  }
}

const checkFeatureDomains = () => {
  if (!fs.existsSync(featuresRoot)) {
    fail('ECS-FEATURES-001', 'src/features is missing')
    return
  }
  for (const entry of listImmediate(featuresRoot)) {
    const fullPath = path.join(featuresRoot, entry.name)
    if (entry.isFile() && isSourceFile(fullPath)) {
      fail(
        'ECS-FEATURES-002',
        `${relativeToProject(fullPath)} is directly under features; use components/entities/systems domains`
      )
    }
    if (entry.isDirectory() && !featureDomains.has(entry.name)) {
      fail(
        'ECS-FEATURES-003',
        `${relativeToProject(fullPath)} is not an allowed ECS top-level domain; expected ${[...featureDomains].sort().join(', ')}`
      )
    }
  }
  for (const domain of featureDomains) {
    const domainRoot = path.join(featuresRoot, domain)
    if (!fs.existsSync(domainRoot)) {
      fail('ECS-FEATURES-004', `${relativeToProject(domainRoot)} is missing`)
    }
  }
}

const checkRoleBuckets = () => {
  for (const scanRoot of [featuresRoot, viewsRoot]) {
    walk(scanRoot, (fullPath, entry) => {
      if (!entry.isDirectory() || !roleBucketDirs.has(entry.name.toLowerCase())) return
      fail(
        'ECS-BUCKET-001',
        `${relativeToProject(fullPath)} is a role/vague bucket folder; use concrete ECS domain folders and role-qualified source leaves`
      )
    })
  }
}

const checkViews = () => {
  if (!fs.existsSync(viewsRoot)) {
    fail('ECS-VIEWS-001', 'src/views is missing; shared presentation belongs under views')
    return
  }
  for (const entry of listImmediate(viewsRoot)) {
    const fullPath = path.join(viewsRoot, entry.name)
    if (entry.isFile() && isSourceFile(fullPath)) {
      fail(
        'ECS-VIEWS-003',
        `${relativeToProject(fullPath)} is directly under views; views must be grouped by presentation domain`
      )
    }
  }
}

console.log('[check] portfolio app ECS conformance guardrails')
console.log(`[path] project: ${projectRoot}`)
console.log('[info] checking app source: src')

checkSourcePresence()
checkRootFiles()
checkFeatureDomains()
checkRoleBuckets()
checkViews()

if (status === 0) {
  console.log('[ok] portfolio app ECS topology matches app ownership')
}

process.exit(status)
