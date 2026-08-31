import { walkNodes } from './astShared.mjs'

const bindingNames = (ts, name) => {
  if (!name) return []
  if (ts.isIdentifier(name)) return [name.text]
  if (!ts.isObjectBindingPattern(name) && !ts.isArrayBindingPattern(name)) return []
  return name.elements.flatMap((element) =>
    ts.isBindingElement(element) ? bindingNames(ts, element.name) : []
  )
}

const isLexicalScope = (ts, node) =>
  ts.isSourceFile(node) ||
  ts.isFunctionLike(node) ||
  ts.isBlock(node) ||
  ts.isCaseBlock(node) ||
  ts.isCatchClause(node) ||
  ts.isForStatement(node) ||
  ts.isForInStatement(node) ||
  ts.isForOfStatement(node)

const nearestScope = (ts, node, functionsOnly = false) => {
  let current = node
  while (current) {
    if (
      functionsOnly
        ? ts.isSourceFile(current) || ts.isFunctionLike(current)
        : isLexicalScope(ts, current)
    )
      return current
    current = current.parent
  }
  return null
}

const addBindings = (bindings, scope, names) => {
  if (!scope) return
  const current = bindings.get(scope) ?? new Set()
  names.forEach((name) => current.add(name))
  bindings.set(scope, current)
}

export const bindingScopes = (ts, sourceFile) => {
  const bindings = new Map()
  walkNodes(ts, sourceFile, (node) => {
    if (ts.isVariableDeclaration(node)) {
      const blockScoped = Boolean(node.parent.flags & ts.NodeFlags.BlockScoped)
      addBindings(
        bindings,
        nearestScope(ts, node.parent.parent, !blockScoped),
        bindingNames(ts, node.name)
      )
    }
    if (ts.isParameter(node))
      addBindings(bindings, node.parent, bindingNames(ts, node.name))
    if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
      if (node.name)
        addBindings(bindings, nearestScope(ts, node.parent), [node.name.text])
    }
    if (ts.isFunctionExpression(node) || ts.isClassExpression(node)) {
      if (node.name) addBindings(bindings, node, [node.name.text])
    }
    if (ts.isImportClause(node) && node.name)
      addBindings(bindings, sourceFile, [node.name.text])
    if (ts.isNamespaceImport(node) || ts.isImportSpecifier(node)) {
      addBindings(bindings, sourceFile, [node.name.text])
    }
    if (ts.isCatchClause(node) && node.variableDeclaration) {
      addBindings(bindings, node, bindingNames(ts, node.variableDeclaration.name))
    }
  })
  return bindings
}

export const isLexicallyBound = (bindings, root, name) => {
  let current = root
  while (current) {
    if (bindings.get(current)?.has(name)) return true
    current = current.parent
  }
  return false
}
