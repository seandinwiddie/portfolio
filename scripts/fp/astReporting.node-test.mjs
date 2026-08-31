import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const checker = fileURLToPath(new URL('./runAstConformance.mjs', import.meta.url))

test('live reporting counts only runtime source files', async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'fp-ast-report-'))
  context.after(() => rm(root, { recursive: true, force: true }))
  const source = path.join(root, 'src')
  await mkdir(source)
  await Promise.all([
    writeFile(path.join(source, 'runtime.ts'), 'export const value = 1\n'),
    writeFile(path.join(source, 'runtime.test.ts'), 'class TestManager {}\n'),
    writeFile(path.join(source, 'types.d.ts'), 'export type Value = number\n'),
  ])
  const result = spawnSync(process.execPath, [checker, root, '--format=json'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(JSON.parse(result.stdout).runtimeFiles, 1)
})
