import { basename } from 'node:path'
import { collectFpAstFindings } from './astConformance.mjs'
import { FP_AST_RULES } from './astRules.mjs'
import { blocking } from './corePackageShared.mjs'
import { authoredSourcesFor } from './corePackageSourceMaps.mjs'
import { bindingScopes, isLexicallyBound } from './corePackageLexicalBindings.mjs'
import { functionName, parseSource, resolveTypescript, walkNodes } from './astShared.mjs'

const effectRoots = new Set([
  'caches',
  'console',
  'document',
  'fetch',
  'globalThis',
  'history',
  'indexedDB',
  'localStorage',
  'location',
  'navigator',
  'process',
  'sessionStorage',
  'window',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'setImmediate',
  'clearImmediate',
  'queueMicrotask',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
])

const effectMembers = new Set([
  'Math.random',
  'Date.now',
  'performance.now',
  'crypto.getRandomValues',
  'crypto.randomUUID',
])

const memberPart = (ts, node) => {
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  const argument = ts.isElementAccessExpression(node) ? node.argumentExpression : null
  return argument && ts.isStringLiteralLike(argument) ? argument.text : null
}

const memberInfo = (ts, node) => {
  if (ts.isIdentifier(node)) return { path: [node.text], root: node }
  if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node))
    return null
  const parent = memberInfo(ts, node.expression)
  const part = memberPart(ts, node)
  return parent && part ? { path: [...parent.path, part], root: parent.root } : null
}

const continuesMemberPath = (ts, node) =>
  Boolean(
    (ts.isPropertyAccessExpression(node.parent) ||
      ts.isElementAccessExpression(node.parent)) &&
      node.parent.expression === node
  )

const identifierIsPropertyName = (ts, node) =>
  Boolean(
    (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) ||
      ((ts.isPropertyAssignment(node.parent) || ts.isMethodDeclaration(node.parent)) &&
        node.parent.name === node)
  )

const capabilityFor = (info, bindings) => {
  if (!info?.path.length || isLexicallyBound(bindings, info.root, info.path[0]))
    return null
  const joined = info.path.join('.')
  return effectMembers.has(joined)
    ? joined
    : effectRoots.has(info.path[0])
      ? info.path[0]
      : null
}

const effectFinding = (unit, sourceFile, node, capability) => {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return blocking(
    'FP-CORE-020',
    `${unit.mode} functional core source ${unit.path}:${location.line + 1}:${location.character + 1} directly accesses global effect capability ${capability}.`,
    '64-65,297-312'
  )
}

const inspectEffects = (unit, ts, sourceFile) => {
  const bindings = bindingScopes(ts, sourceFile)
  const findings = []
  walkNodes(ts, sourceFile, (node) => {
    if (
      (!ts.isIdentifier(node) &&
        !ts.isPropertyAccessExpression(node) &&
        !ts.isElementAccessExpression(node)) ||
      continuesMemberPath(ts, node) ||
      (ts.isIdentifier(node) && identifierIsPropertyName(ts, node))
    )
      return
    const capability = capabilityFor(memberInfo(ts, node), bindings)
    if (capability) findings.push(effectFinding(unit, sourceFile, node, capability))
  })
  return findings
}

const helperRanges = (ts, sourceFile) => {
  const ranges = []
  walkNodes(ts, sourceFile, (node) => {
    if (ts.isFunctionLike(node) && /^__/.test(functionName(ts, node, sourceFile))) {
      ranges.push([node.getStart(sourceFile), node.end])
    }
  })
  return ranges
}

const positionOf = (sourceFile, finding) =>
  sourceFile.getPositionOfLineAndCharacter(finding.line - 1, finding.column - 1)

const sourceSeverity = (finding, generated, ranges, sourceFile) => {
  if (!generated || finding.ruleId === FP_AST_RULES.classMechanics.id) return 'BLOCKING'
  if (finding.ruleId === FP_AST_RULES.dataArity.id) return 'REVIEW'
  const position = positionOf(sourceFile, finding)
  const helper = ranges.some(([start, end]) => position >= start && position < end)
  return helper &&
    [FP_AST_RULES.controlStatement.id, FP_AST_RULES.payloadArity.id].includes(
      finding.ruleId
    )
    ? 'REVIEW'
    : 'BLOCKING'
}

const astFinding = (unit, finding, severity) => ({
  code: 'FP-CORE-019',
  severity,
  message: `${unit.mode} functional core source ${unit.path}:${finding.line}:${finding.column} violates ${finding.ruleId}: ${finding.message}.`,
  skillReference: finding.skillRef,
  advice: finding.advice,
})

const inspectAst = (unit, projectRoot, ts, generated, classOnly = false) => {
  const sourceFile = parseSource(ts, unit.path, unit.text)
  const rel = `src/fpCore/${unit.mode.toLowerCase()}/${basename(unit.path)}`
  const ranges = helperRanges(ts, sourceFile)
  return collectFpAstFindings(
    { projectRoot },
    { rel, filePath: unit.path, text: unit.text, scope: 'core' }
  )
    .filter(
      ({ disposition, ruleId }) =>
        disposition === 'BLOCK' &&
        (!classOnly || ruleId === FP_AST_RULES.classMechanics.id)
    )
    .map((finding) =>
      astFinding(unit, finding, sourceSeverity(finding, generated, ranges, sourceFile))
    )
}

const inspectModule = async (module, graph, projectRoot, ts) => {
  const authored = await authoredSourcesFor(module, graph.packageDirectory)
  const canonical = authored.length
    ? authored.flatMap((unit) => inspectAst(unit, projectRoot, ts, false))
    : inspectAst(module, projectRoot, ts, true)
  const runtimeClasses = authored.length
    ? inspectAst(module, projectRoot, ts, true, true)
    : []
  const effects = [module, ...authored].flatMap((unit) => {
    const sourceFile = parseSource(ts, unit.path, unit.text)
    return inspectEffects(unit, ts, sourceFile)
  })
  return [...canonical, ...runtimeClasses, ...effects]
}

export const inspectCoreSources = async (graph, projectRoot = process.cwd()) => {
  const ts = resolveTypescript(projectRoot)
  if (!ts) throw new Error('TypeScript parser is required for FP core source checks')
  const findings = (
    await Promise.all(
      graph.modules.map((module) => inspectModule(module, graph, projectRoot, ts))
    )
  ).flat()
  return [
    ...new Map(
      findings.map((finding) => [
        `${finding.code}:${finding.severity}:${finding.message}`,
        finding,
      ])
    ).values(),
  ]
}
