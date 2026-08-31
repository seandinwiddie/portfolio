import { FP_AST_RULES } from './astRules.mjs'
import { dispositionForScope } from './astScope.mjs'
import { findingFor, functionName, unwrapExpression, walkNodes } from './astShared.mjs'

const composeBindingsFor = (typescript, sourceFile) => {
  const bindings = new Set(['compose'])
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isImportSpecifier(node)) return
    const imported = node.propertyName?.text ?? node.name.text
    if (imported === 'compose') bindings.add(node.name.text)
  })
  return bindings
}

const isComposeCall = (typescript, node, bindings) => {
  if (!typescript.isCallExpression(node)) return false
  const expression = unwrapExpression(typescript, node.expression)
  if (typescript.isIdentifier(expression)) return bindings.has(expression.text)
  return (
    typescript.isPropertyAccessExpression(expression) &&
    expression.name.text === 'compose'
  )
}

const parentIgnoringParens = (typescript, node) => {
  let parent = node.parent
  while (parent && typescript.isParenthesizedExpression(parent)) parent = parent.parent
  return parent
}

const isNestedConditional = (typescript, node) =>
  typescript.isConditionalExpression(unwrapExpression(typescript, node.condition)) ||
  typescript.isConditionalExpression(unwrapExpression(typescript, node.whenTrue)) ||
  typescript.isConditionalExpression(unwrapExpression(typescript, node.whenFalse))

const collectConditionalChains = (file, typescript, sourceFile, scope) => {
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (
      !typescript.isConditionalExpression(node) ||
      !isNestedConditional(typescript, node)
    )
      return
    if (typescript.isConditionalExpression(parentIgnoringParens(typescript, node))) return
    findings.push(
      findingFor(
        FP_AST_RULES.conditionalChain,
        file,
        sourceFile,
        node,
        'nested conditional expression routes more than one branch',
        dispositionForScope(scope)
      )
    )
  })
  return findings
}

const collectNestedCompose = (file, typescript, sourceFile) => {
  const findings = []
  const bindings = composeBindingsFor(typescript, sourceFile)
  walkNodes(typescript, sourceFile, (node) => {
    if (!isComposeCall(typescript, node, bindings)) return
    const nested = node.arguments.some((argument) => {
      const expression = unwrapExpression(typescript, argument)
      return isComposeCall(typescript, expression, bindings)
    })
    if (!nested) return
    const parent = parentIgnoringParens(typescript, node)
    if (isComposeCall(typescript, parent, bindings)) return
    findings.push(
      findingFor(
        FP_AST_RULES.nestedCompose,
        file,
        sourceFile,
        node,
        'hand-nested compose call'
      )
    )
  })
  return findings
}

const trampolineDeferred = (typescript, functionNode, call) => {
  let current = call.parent
  while (current && current !== functionNode) {
    if (
      typescript.isFunctionLike(current) &&
      typescript.isCallExpression(current.parent) &&
      typescript.isIdentifier(unwrapExpression(typescript, current.parent.expression)) &&
      unwrapExpression(typescript, current.parent.expression).text === 'call' &&
      current.parent.arguments.includes(current)
    )
      return true
    current = current.parent
  }
  return false
}

const ownsDirectSelfCall = (typescript, functionNode, name) => {
  let found = false
  const visit = (node) => {
    if (found) return
    if (
      typescript.isCallExpression(node) &&
      typescript.isIdentifier(unwrapExpression(typescript, node.expression)) &&
      unwrapExpression(typescript, node.expression).text === name &&
      !trampolineDeferred(typescript, functionNode, node)
    ) {
      found = true
      return
    }
    typescript.forEachChild(node, visit)
  }
  visit(functionNode)
  return found
}

const collectDirectRecursion = (file, typescript, sourceFile) => {
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isFunctionLike(node) || !node.body) return
    const name = functionName(typescript, node, sourceFile)
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) return
    if (!ownsDirectSelfCall(typescript, node, name)) return
    findings.push(
      findingFor(
        FP_AST_RULES.directRecursion,
        file,
        sourceFile,
        node,
        `direct self-recursion in ${name}; boundedness is not mechanically proven`,
        'SMELL'
      )
    )
  })
  return findings
}

export const collectFpCompositionFindings = (
  file,
  typescript,
  sourceFile,
  { scope = 'core' } = {}
) => [
  ...collectConditionalChains(file, typescript, sourceFile, scope),
  ...collectNestedCompose(file, typescript, sourceFile),
  ...collectDirectRecursion(file, typescript, sourceFile),
]
