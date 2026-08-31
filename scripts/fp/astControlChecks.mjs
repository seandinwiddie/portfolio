import { FP_AST_RULES, TRAMPOLINE_DRIVER_MARKER } from './astRules.mjs'
import { collectFpClassFindings } from './astClassChecks.mjs'
import {
  findingFor,
  functionName,
  functionOwner,
  markerReason,
  walkNodes,
} from './astShared.mjs'
import { dispositionForScope } from './astScope.mjs'

const isLoopStatement = (typescript, node) =>
  typescript.isForStatement(node) ||
  typescript.isForInStatement(node) ||
  typescript.isForOfStatement(node) ||
  typescript.isWhileStatement(node) ||
  typescript.isDoStatement(node)

const controlKind = (typescript, node) => {
  if (typescript.isIfStatement(node)) return 'if'
  if (typescript.isSwitchStatement(node)) return 'switch'
  if (typescript.isForStatement(node)) return 'for'
  if (typescript.isForInStatement(node)) return 'for-in'
  if (typescript.isForOfStatement(node)) return 'for-of'
  if (typescript.isWhileStatement(node)) return 'while'
  if (typescript.isDoStatement(node)) return 'do'
  return null
}

const ownedLoops = (typescript, functionNode) => {
  const loops = []
  const visit = (node) => {
    if (node !== functionNode && typescript.isFunctionLike(node)) return
    if (isLoopStatement(typescript, node)) loops.push(node)
    typescript.forEachChild(node, visit)
  }
  visit(functionNode)
  return loops
}

const acceptedTrampolineLoops = (typescript, sourceFile) => {
  const accepted = new Set()
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isFunctionLike(node) || !node.body) return
    const owner = functionOwner(typescript, node)
    const annotated =
      markerReason(typescript, sourceFile, owner, TRAMPOLINE_DRIVER_MARKER) !== null
    if (!annotated || functionName(typescript, node, sourceFile) !== 'trampoline') return
    const loops = ownedLoops(typescript, node)
    if (loops.length === 1) accepted.add(loops[0])
  })
  return accepted
}

export const countAcceptedTrampolineDrivers = (typescript, sourceFile) =>
  acceptedTrampolineLoops(typescript, sourceFile).size

const collectControlFindings = (
  file,
  typescript,
  sourceFile,
  { allowTrampolineDriver, scope }
) => {
  const findings = []
  const acceptedLoops = allowTrampolineDriver
    ? acceptedTrampolineLoops(typescript, sourceFile)
    : new Set()
  walkNodes(typescript, sourceFile, (node) => {
    const kind = controlKind(typescript, node)
    if (!kind) return
    if (acceptedLoops.has(node)) {
      findings.push(
        findingFor(
          FP_AST_RULES.documentedException,
          file,
          sourceFile,
          node,
          'documented trampoline-driver loop; confirm it alone interprets Call/Done Bounce data'
        )
      )
      return
    }
    findings.push(
      findingFor(
        FP_AST_RULES.controlStatement,
        file,
        sourceFile,
        node,
        `imperative ${kind} statement`,
        dispositionForScope(scope)
      )
    )
  })
  return findings
}

export const collectFpControlFindings = (
  file,
  typescript,
  sourceFile,
  { allowTrampolineDriver = true, scope = 'core' } = {}
) => [
  ...collectFpClassFindings(file, typescript, sourceFile),
  ...collectControlFindings(file, typescript, sourceFile, {
    allowTrampolineDriver,
    scope,
  }),
]
