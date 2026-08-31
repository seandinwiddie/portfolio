#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const testFiles = fs
  .readdirSync(scriptDir)
  .filter((name) => name.endsWith('.node-test.mjs'))
  .sort()
  .map((name) => path.join(scriptDir, name))

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
