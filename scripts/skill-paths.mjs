import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Return the finite directory ancestry used to discover workspace skills. */
const ancestorDirectoriesOf = (directory) => {
  const parent = path.dirname(directory)
  return parent === directory
    ? [directory]
    : [directory, ...ancestorDirectoriesOf(parent)]
}

const configuredRoots = [
  process.env.AGENT_SKILLS_ROOT,
  process.env.CODEX_SKILLS_ROOT,
].filter(Boolean)

const discoveredRoots = [
  ...ancestorDirectoriesOf(projectRoot).map((root) =>
    path.join(root, '.agents', 'skills')
  ),
  path.join(os.homedir(), '.agents', 'skills'),
  path.join(os.homedir(), '.codex', 'skills'),
]

const skillRoots = [...new Set([...configuredRoots, ...discoveredRoots])]

/** Resolve an installed skill directory without embedding one developer home. */
export const skillDirectoryOf = (directoryName) => {
  const candidates = skillRoots.map((root) => path.join(root, directoryName))
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
}

/** Resolve an installed skill entrypoint without embedding one checkout path. */
export const skillFileOf = (directoryName) =>
  path.join(skillDirectoryOf(directoryName), 'SKILL.md')
