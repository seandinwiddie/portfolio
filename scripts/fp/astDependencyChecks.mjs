import path from 'node:path'

import { FP_AST_RULES } from './astRules.mjs'
import { classifyFpSourceScope } from './astScope.mjs'
import { findingFor, parseSource, walkNodes } from './astShared.mjs'

const sourceExtensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']

const normalizedRel = (unit) =>
  String(unit.rel ?? unit.filePath)
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')

const moduleSpecifierAt = (typescript, node) => {
  if (
    (typescript.isImportDeclaration(node) || typescript.isExportDeclaration(node)) &&
    node.moduleSpecifier &&
    typescript.isStringLiteralLike(node.moduleSpecifier)
  )
    return node.moduleSpecifier
  if (!typescript.isCallExpression(node) || node.arguments.length !== 1) return null
  const expression = node.expression
  const importCall = expression.kind === typescript.SyntaxKind.ImportKeyword
  const requireCall = typescript.isIdentifier(expression) && expression.text === 'require'
  const specifier = node.arguments[0]
  return (importCall || requireCall) && typescript.isStringLiteralLike(specifier)
    ? specifier
    : null
}

const relativeCandidates = (sourceRel, specifier) => {
  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceRel), specifier)
  )
  return [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...sourceExtensions.map((extension) => path.posix.join(base, `index${extension}`)),
  ]
}

const targetFor = (unitsByRel, sourceRel, specifier) =>
  relativeCandidates(sourceRel, specifier)
    .map((candidate) => unitsByRel.get(candidate))
    .find(Boolean) ?? null

const dependencyDisposition = (targetScope) =>
  targetScope === 'boundary' ? 'BLOCK' : 'REVIEW'

export const collectFpDependencyFindings = (units, typescript) => {
  const unitsByRel = new Map(units.map((unit) => [normalizedRel(unit), unit]))
  return units.flatMap((unit) => {
    const sourceRel = normalizedRel(unit)
    const sourceScope = unit.scope ?? classifyFpSourceScope(sourceRel)
    if (sourceScope !== 'core') return []
    const sourceFile = parseSource(typescript, unit.filePath ?? sourceRel, unit.text)
    const findings = []
    walkNodes(typescript, sourceFile, (node) => {
      const specifierNode = moduleSpecifierAt(typescript, node)
      const specifier = specifierNode?.text
      if (!specifier?.startsWith('.')) return
      const target = targetFor(unitsByRel, sourceRel, specifier)
      if (!target) return
      const targetRel = normalizedRel(target)
      const targetScope = target.scope ?? classifyFpSourceScope(targetRel)
      if (targetScope === 'core') return
      findings.push({
        ...findingFor(
          FP_AST_RULES.coreDependency,
          sourceRel,
          sourceFile,
          specifierNode,
          `functional core imports ${targetScope} module ${targetRel}`,
          dependencyDisposition(targetScope)
        ),
        scope: sourceScope,
      })
    })
    return findings
  })
}
