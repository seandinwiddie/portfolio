import { blocking } from './corePackageShared.mjs'

const externalFinding = (edge) =>
  blocking(
    'FP-CORE-017',
    `${edge.mode} functional core module ${edge.from}:${edge.line}:${edge.column} imports external runtime capability ${edge.specifier}.`,
    '64-65,297-312'
  )

const issueFinding = (issue) =>
  blocking(
    'FP-CORE-017',
    `${issue.mode} functional core module ${issue.from}:${issue.line}:${issue.column} has ${issue.kind} import ${issue.specifier}${issue.target ? ` (${issue.target})` : ''}.`,
    '64-65,297-312'
  )

export const inspectRuntimeImports = (graph) => [
  ...graph.externals.map(externalFinding),
  ...graph.issues.map(issueFinding),
]
