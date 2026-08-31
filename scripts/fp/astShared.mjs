import path from 'node:path'
import { parseSource, resolveTypescript, walkNodes } from '../redux/typescriptAst.mjs'
import { FP_SKILL_REVIEW_ADVICE } from './astRules.mjs'

export { parseSource, resolveTypescript, walkNodes }

const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
])
const excludedParts = new Set([
  '.git',
  'node_modules',
  'coverage',
  'dist',
  'build',
  '__tests__',
  '__fixtures__',
  'tests',
  'test',
  'testing',
  'scripts',
])
const testMarkers = ['.test.', '.spec.', '.bdd.', '.node-test.']

export const isRuntimeSourcePath = (filePath) => {
  const normalized = String(filePath).replaceAll('\\', '/')
  const parts = normalized.split('/').filter(Boolean)
  const basename = parts.at(-1) ?? ''
  if (!sourceExtensions.has(path.extname(basename).toLowerCase())) return false
  if (basename.endsWith('.d.ts')) return false
  if (parts.some((part) => excludedParts.has(part))) return false
  return !testMarkers.some((marker) => basename.includes(marker))
}

export const isAppRuntimeSourcePath = (filePath) => {
  const normalized = String(filePath).replaceAll('\\', '/').replace(/^\.\//, '')
  return /^(?:src|app)\//.test(normalized) && isRuntimeSourcePath(normalized)
}

export const locationFor = (sourceFile, node) => {
  const start = node?.getStart(sourceFile) ?? 0
  const location = sourceFile.getLineAndCharacterOfPosition(start)
  return { line: location.line + 1, column: location.character + 1 }
}

export const findingFor = (
  rule,
  file,
  sourceFile,
  node,
  message,
  disposition = rule.disposition
) => {
  const normalizedDisposition = disposition.toUpperCase()
  return {
    ruleId: rule.id,
    disposition: normalizedDisposition,
    level: normalizedDisposition === 'BLOCK' ? 'block' : 'review',
    skillRef: rule.skillRef,
    advice: FP_SKILL_REVIEW_ADVICE,
    file,
    ...locationFor(sourceFile, node),
    message,
    guidance: rule.guidance,
  }
}

const leadingDocumentation = (typescript, sourceFile, node) => {
  const ranges =
    typescript.getLeadingCommentRanges(sourceFile.text, node.getFullStart()) ?? []
  return ranges
    .map(({ pos, end }) => sourceFile.text.slice(pos, end))
    .filter((comment) => comment.startsWith('/**'))
    .map((comment) =>
      comment
        .replace(/^\/\*\*/, '')
        .replace(/\*\/$/, '')
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\*\s?/, ''))
        .join(' ')
    )
}

export const markerReason = (typescript, sourceFile, node, marker) => {
  const comment = leadingDocumentation(typescript, sourceFile, node).find((candidate) =>
    candidate.includes(marker)
  )
  if (!comment) return null
  const reason = comment.slice(comment.indexOf(marker) + marker.length).trim()
  return reason || ''
}

export const functionOwner = (typescript, node) => {
  if (
    (typescript.isArrowFunction(node) || typescript.isFunctionExpression(node)) &&
    typescript.isVariableDeclaration(node.parent)
  )
    return node.parent.parent.parent
  return node
}

export const functionName = (typescript, node, sourceFile) => {
  if (node.name) return node.name.getText(sourceFile)
  if (
    (typescript.isArrowFunction(node) || typescript.isFunctionExpression(node)) &&
    typescript.isVariableDeclaration(node.parent)
  )
    return node.parent.name.getText(sourceFile)
  return '<anonymous>'
}

export const unwrapExpression = (typescript, node) => {
  let current = node
  while (
    current &&
    (typescript.isParenthesizedExpression(current) ||
      typescript.isAsExpression(current) ||
      typescript.isTypeAssertionExpression(current) ||
      typescript.isNonNullExpression(current) ||
      typescript.isSatisfiesExpression?.(current))
  )
    current = current.expression
  return current
}
