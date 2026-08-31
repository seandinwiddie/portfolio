#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptRoot, '../..')
const nodeFixtures = readdirSync(scriptRoot)
  .filter((name) => name.endsWith('.node-test.mjs'))
  .sort()
  .map((name) => `scripts/fp/${name}`)
const checks = [
  {
    label: 'FP checker fixtures and executable laws',
    command: process.execPath,
    args: ['--test', ...nodeFixtures],
  },
  {
    label: 'FP Python contract fixtures',
    command: 'python3',
    args: ['scripts/fp/fp_fixtures.py'],
  },
  {
    label: 'FP TypeScript AST live scan',
    command: process.execPath,
    args: ['scripts/fp/runAstConformance.mjs', projectRoot],
  },
  {
    label: 'FP installed-core live contract',
    command: process.execPath,
    args: ['scripts/fp/corePackageContract.mjs', projectRoot],
  },
  {
    label: 'FP surface and contextual review scan',
    command: 'python3',
    args: ['scripts/fp/source_conformance.py'],
  },
]

const results = checks.map(({ label, command, args }) => {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  const status = result.status ?? 1
  console.log(`=== ${label}: ${status === 0 ? 'passed' : `failed (exit ${status})`} ===`)
  return { label, status }
})
const failed = results.filter(({ status }) => status !== 0)

console.log(
  `\nFP check completed: ${checks.length - failed.length} passed, ${failed.length} failed.`
)
failed.forEach(({ label, status }) => console.log(`  - ${label}: exit ${status}`))
process.exitCode = failed.length ? 1 : 0
