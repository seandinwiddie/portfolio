import { nodeName, walkNodes } from './typescriptAst.mjs'

const requestLikeName =
  /(?:^|[/_-])(?:fetch|get|list|load|query|read|refresh|search|sync)(?:$|[/_-])/i

const callName = (typescript, node) => {
  if (!typescript.isCallExpression(node)) return ''
  if (typescript.isIdentifier(node.expression)) return node.expression.text
  return typescript.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : ''
}

export const fetchCallsIn = (typescript, root) => {
  const calls = []
  walkNodes(typescript, root, (node) => {
    if (callName(typescript, node) === 'fetch') calls.push(node)
  })
  return calls
}

const fetchMethod = (typescript, sourceFile, fetchCall) => {
  const options = fetchCall.arguments[1]
  if (!options || !typescript.isObjectLiteralExpression(options)) return 'GET'
  const method = options.properties.find(
    (property) => nodeName(typescript, property.name, sourceFile) === 'method'
  )
  if (!method || !typescript.isPropertyAssignment(method)) return 'GET'
  return typescript.isStringLiteralLike(method.initializer)
    ? method.initializer.text.toUpperCase()
    : 'UNKNOWN'
}

const thunkName = (typescript, thunkCall) => {
  const typeArgument = thunkCall.arguments[0]
  return typeArgument && typescript.isStringLiteralLike(typeArgument)
    ? typeArgument.text
    : ''
}

export const asyncThunkFetchNeedsCondition = (typescript, sourceFile, thunkCall) => {
  const payloadCreator = thunkCall.arguments[1]
  if (!payloadCreator) return false
  const fetchCalls = fetchCallsIn(typescript, payloadCreator)
  if (!fetchCalls.length) return false
  return (
    requestLikeName.test(thunkName(typescript, thunkCall)) ||
    fetchCalls.some((fetchCall) =>
      ['GET', 'UNKNOWN'].includes(fetchMethod(typescript, sourceFile, fetchCall))
    )
  )
}

export const asyncThunkHasCondition = (typescript, sourceFile, thunkCall) => {
  const options = thunkCall.arguments[2]
  return Boolean(
    options &&
      typescript.isObjectLiteralExpression(options) &&
      options.properties.some(
        (property) => nodeName(typescript, property.name, sourceFile) === 'condition'
      )
  )
}
