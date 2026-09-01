#!/usr/bin/env node
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { collectApiDataAuthorityFindings } from './redux/apiDataAuthority.mjs'
import { createProjectContext } from './redux/projectContext.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptDirectory, '..')
const argumentsList = process.argv.slice(2)

if (argumentsList.includes('--help') || argumentsList.includes('-h')) {
  console.info(`Usage:
  check-api-data-authority.mjs [project-root]

Requires registry runtime data to flow through
src/features/systems/substrate/kernel/api and
blocks local authored-data imports, every production JSON file under src, and
direct fetch or axios elsewhere.`)
  process.exit(0)
}

if (argumentsList.length > 1) {
  console.error('[fail] Expected zero or one project root argument.')
  process.exit(2)
}

const projectRoot = path.resolve(process.cwd(), argumentsList[0] ?? defaultRoot)
if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
  console.error(`[fail] Project root does not exist: ${projectRoot}`)
  process.exit(1)
}

const context = createProjectContext(projectRoot)
const findings = collectApiDataAuthorityFindings(context)

console.info('[check] registry API data-authority guardrails')
console.info(`[path] project: ${projectRoot}`)
console.info(`[info] production source files discovered: ${context.sourceFiles.length}`)
console.info(
  `[info] production JSON files discovered under src: ${context.sourceJsonFiles.length}`
)
findings.forEach((finding) => console.error(finding))

if (!findings.length) {
  console.info(
    '[ok] runtime data flows through the RTK Query API boundary; local contracts/styles remain presentation-only'
  )
}

process.exit(Number(findings.length > 0))
