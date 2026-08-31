import { unwrapExpression, walkNodes } from './astShared.mjs'

const callbackTypeName =
  /(?:Callback|Handler|Predicate|Reducer|Thunk|Listener|Dispatch|Effect|Fn|Function)$/

export const typeNameText = (typescript, node) => {
  if (typescript.isIdentifier(node)) return node.text
  if (typescript.isQualifiedName(node)) return node.right.text
  return ''
}

export const callableAliasesFor = (typescript, sourceFile) => {
  const aliases = new Map()
  walkNodes(typescript, sourceFile, (node) => {
    if (typescript.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type)
    if (typescript.isInterfaceDeclaration(node)) {
      aliases.set(
        node.name.text,
        node.members.some(
          (member) =>
            typescript.isCallSignatureDeclaration(member) ||
            typescript.isConstructSignatureDeclaration(member)
        )
      )
    }
  })
  return aliases
}

const isNullishType = (typescript, typeNode) =>
  typeNode.kind === typescript.SyntaxKind.UndefinedKeyword ||
  typeNode.kind === typescript.SyntaxKind.NullKeyword ||
  typeNode.kind === typescript.SyntaxKind.NeverKeyword

const combineUnionKinds = (kinds) => {
  const meaningful = kinds.filter((kind) => kind !== 'nullish')
  if (!meaningful.length || meaningful.includes('data')) return 'data'
  return meaningful.includes('uncertain') ? 'uncertain' : 'callable'
}

const combineIntersectionKinds = (kinds) => {
  if (kinds.includes('callable')) return 'callable'
  if (kinds.includes('uncertain')) return 'uncertain'
  return 'data'
}

const callableTypeKind = (typescript, typeNode, aliases, called, seen = new Set()) => {
  if (!typeNode) return called ? 'callable' : 'data'
  if (isNullishType(typescript, typeNode)) return 'nullish'
  if (
    typescript.isFunctionTypeNode(typeNode) ||
    typescript.isConstructorTypeNode(typeNode)
  )
    return 'callable'
  if (typescript.isParenthesizedTypeNode(typeNode)) {
    return callableTypeKind(typescript, typeNode.type, aliases, called, seen)
  }
  if (typescript.isUnionTypeNode(typeNode)) {
    return combineUnionKinds(
      typeNode.types.map((type) =>
        callableTypeKind(typescript, type, aliases, called, seen)
      )
    )
  }
  if (typescript.isIntersectionTypeNode(typeNode)) {
    return combineIntersectionKinds(
      typeNode.types.map((type) =>
        callableTypeKind(typescript, type, aliases, called, seen)
      )
    )
  }
  if (typescript.isTypeLiteralNode(typeNode)) {
    return typeNode.members.some(
      (member) =>
        typescript.isCallSignatureDeclaration(member) ||
        typescript.isConstructSignatureDeclaration(member)
    )
      ? 'callable'
      : 'data'
  }
  if (!typescript.isTypeReferenceNode(typeNode)) {
    const unresolved =
      typeNode.kind === typescript.SyntaxKind.AnyKeyword ||
      typeNode.kind === typescript.SyntaxKind.UnknownKeyword
    return unresolved && called ? 'uncertain' : 'data'
  }
  const name = typeNameText(typescript, typeNode.typeName)
  if (name === 'Function') return 'callable'
  if (seen.has(name)) return 'data'
  if (!aliases.has(name))
    return called || callbackTypeName.test(name) ? 'uncertain' : 'data'
  if (aliases.get(name) === true) return 'callable'
  if (aliases.get(name) === false) return 'data'
  return callableTypeKind(
    typescript,
    aliases.get(name),
    aliases,
    called,
    new Set(seen).add(name)
  )
}

const parameterIsCalled = (typescript, functionNode, parameter) => {
  if (!typescript.isIdentifier(parameter.name)) return false
  const name = parameter.name.text
  let called = false
  const visit = (node) => {
    if (called) return
    if (node !== functionNode && typescript.isFunctionLike(node)) {
      const shadows = node.parameters.some(
        (item) => typescript.isIdentifier(item.name) && item.name.text === name
      )
      if (shadows) return
    }
    if (typescript.isCallExpression(node)) {
      const expression = unwrapExpression(typescript, node.expression)
      if (typescript.isIdentifier(expression) && expression.text === name) {
        called = true
        return
      }
      if (
        typescript.isPropertyAccessExpression(expression) &&
        typescript.isIdentifier(unwrapExpression(typescript, expression.expression)) &&
        unwrapExpression(typescript, expression.expression).text === name &&
        ['apply', 'bind', 'call'].includes(expression.name.text)
      ) {
        called = true
        return
      }
    }
    typescript.forEachChild(node, visit)
  }
  visit(functionNode.body)
  return called
}

export const parameterKind = (typescript, functionNode, parameter, aliases) => {
  if (typescript.isIdentifier(parameter.name) && parameter.name.text === 'this') {
    return 'callable'
  }
  if (
    parameter.initializer &&
    (typescript.isArrowFunction(parameter.initializer) ||
      typescript.isFunctionExpression(parameter.initializer))
  )
    return 'callable'
  return callableTypeKind(
    typescript,
    parameter.type,
    aliases,
    parameterIsCalled(typescript, functionNode, parameter)
  )
}
