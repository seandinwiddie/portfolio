#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createProjectContext } from '../redux/projectContext.mjs'
import {
  collectFpAstFindingsForUnits,
  formatFpAstFinding,
  isAppRuntimeSourcePath,
} from './astConformance.mjs'

const scriptRoot = path.dirname(fileURLToPath(import.meta.url))
const defaultRoot = path.resolve(scriptRoot, '../..')
const rawArgs = process.argv.slice(2)
const formatArg = rawArgs.find((arg) => arg.startsWith('--format='))
const format = formatArg?.slice('--format='.length) ?? 'text'
const positional = rawArgs.filter((arg) => !arg.startsWith('--format='))

if (positional.length > 1 || !['text', 'json'].includes(format)) {
  console.error('Usage: runAstConformance.mjs [project-root] [--format=text|json]')
  process.exit(2)
}

const projectRoot = path.resolve(positional[0] ?? defaultRoot)
if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
  console.error(`[fail] Project root does not exist: ${projectRoot}`)
  process.exit(2)
}

const context = createProjectContext(projectRoot)
const units = context.sourceFiles.flatMap((filePath) => {
  const rel = context.relativeToProject(filePath)
  return isAppRuntimeSourcePath(rel)
    ? [{ filePath, rel, text: context.readText(filePath) }]
    : []
})
const runtimeFiles = units.length
const findings = collectFpAstFindingsForUnits(context, units).sort(
  (left, right) =>
    left.disposition.localeCompare(right.disposition) ||
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.column - right.column ||
    left.ruleId.localeCompare(right.ruleId)
)
const counts = findings.reduce(
  (summary, finding) => ({
    ...summary,
    [finding.disposition]: (summary[finding.disposition] ?? 0) + 1,
  }),
  {}
)
const blockers = counts.BLOCK ?? 0

if (format === 'json') {
  console.log(
    JSON.stringify(
      {
        projectRoot,
        runtimeFiles,
        counts,
        findings,
      },
      null,
      2
    )
  )
} else {
  console.log('[check] FP TypeScript AST conformance')
  console.log(`[path] project: ${projectRoot}`)
  console.log(`[info] runtime source files discovered: ${runtimeFiles}`)
  console.log(
    `[result] ${blockers} BLOCK, ${counts.REVIEW ?? 0} REVIEW, ${counts.SMELL ?? 0} SMELL`
  )
  findings.forEach((finding) => console.log(formatFpAstFinding(finding)))
  console.log(`[done] FP AST conformance complete (exit ${blockers ? 1 : 0})`)
}

process.exitCode = blockers ? 1 : 0
