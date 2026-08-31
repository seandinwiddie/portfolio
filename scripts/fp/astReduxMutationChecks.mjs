import { unwrapExpression } from './astShared.mjs'

const mutatingMethods = new Set(['add', 'fill', 'push', 'set', 'splice', 'unshift'])

const rootedAtState = (ts, node, stateName) => {
  let current = unwrapExpression(ts, node)
  while (
    ts.isPropertyAccessExpression(current) ||
    ts.isElementAccessExpression(current)
  ) {
    current = unwrapExpression(ts, current.expression)
  }
  return ts.isIdentifier(current) && current.text === stateName
}

const mutationArguments = (ts, node, stateName) => {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression))
    return []
  const owner = unwrapExpression(ts, node.expression.expression)
  const method = node.expression.name.text
  if (
    ts.isIdentifier(owner) &&
    owner.text === 'Object' &&
    method === 'assign' &&
    node.arguments[0] &&
    rootedAtState(ts, node.arguments[0], stateName)
  )
    return node.arguments.slice(1)
  return mutatingMethods.has(method) && rootedAtState(ts, owner, stateName)
    ? [...node.arguments]
    : []
}

export const reduxStoredValues = (ts, fn, stateName) => {
  if (!fn.body) return []
  const values = []
  const visit = (node) => {
    if (node !== fn.body && ts.isFunctionLike(node)) return
    if (
      ts.isBinaryExpression(node) &&
      ts.isAssignmentOperator(node.operatorToken.kind) &&
      rootedAtState(ts, node.left, stateName)
    )
      values.push(node.right)
    values.push(...mutationArguments(ts, node, stateName))
    ts.forEachChild(node, visit)
  }
  visit(fn.body)
  return values
}
