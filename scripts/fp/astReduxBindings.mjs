import { unwrapExpression, walkNodes } from './astShared.mjs'

const wrapperValues = new Set([
  'just',
  'nothing',
  'left',
  'right',
  'success',
  'failure',
  'some',
  'none',
])
const wrapperTypes = new Set(['Maybe', 'Either', 'Validation', 'Option', 'Result'])
const reduxFactories = new Set(['createSlice', 'createReducer'])
const fpModule =
  /functional-programming-composition|(?:^|\/)(?:fp|maybe|either|validation)(?:$|[./_-])/i

export const reduxBindingsFor = (ts, sourceFile) => {
  const values = new Map()
  const types = new Map()
  const fpNamespaces = new Set()
  const redux = new Map()
  const reduxNamespaces = new Set()
  const importedTypes = new Set()
  const importedNamespaces = new Set()
  walkNodes(ts, sourceFile, (node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return
    const clause = node.importClause
    const named = clause?.namedBindings
    const moduleName = node.moduleSpecifier.text
    if (clause?.name) importedTypes.add(clause.name.text)
    if (named && ts.isNamespaceImport(named)) importedNamespaces.add(named.name.text)
    if (named && ts.isNamedImports(named)) {
      named.elements.forEach((element) => importedTypes.add(element.name.text))
    }
    if (fpModule.test(moduleName) && named && ts.isNamespaceImport(named)) {
      fpNamespaces.add(named.name.text)
    } else if (fpModule.test(moduleName) && named && ts.isNamedImports(named)) {
      named.elements.forEach((element) => {
        const imported = element.propertyName?.text ?? element.name.text
        if (wrapperValues.has(imported)) values.set(element.name.text, imported)
        if (wrapperTypes.has(imported)) types.set(element.name.text, imported)
      })
    }
    if ((moduleName === '@reduxjs/toolkit' || moduleName === 'redux') && named) {
      if (ts.isNamespaceImport(named)) reduxNamespaces.add(named.name.text)
      if (ts.isNamedImports(named))
        named.elements.forEach((element) => {
          const imported = element.propertyName?.text ?? element.name.text
          if (reduxFactories.has(imported)) redux.set(element.name.text, imported)
        })
    }
  })
  return {
    values,
    types,
    fpNamespaces,
    redux,
    reduxNamespaces,
    importedTypes,
    importedNamespaces,
  }
}

const importedMember = (ts, node, namespaces, names) => {
  if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.expression))
    return null
  return namespaces.has(node.expression.text) && names.has(node.name.text)
    ? node.name.text
    : null
}

export const wrapperValueAt = (ts, node, bindings) => {
  const value = unwrapExpression(ts, node)
  if (ts.isIdentifier(value)) return bindings.values.get(value.text) ?? null
  return importedMember(ts, value, bindings.fpNamespaces, wrapperValues)
}

export const reduxFactoryAt = (ts, call, bindings) => {
  const expression = unwrapExpression(ts, call.expression)
  if (ts.isIdentifier(expression)) return bindings.redux.get(expression.text) ?? null
  return importedMember(ts, expression, bindings.reduxNamespaces, reduxFactories)
}

export const wrapperTypeAt = (ts, typeName, bindings) => {
  if (ts.isIdentifier(typeName)) return bindings.types.get(typeName.text) ?? null
  if (!ts.isQualifiedName(typeName) || !ts.isIdentifier(typeName.left)) return null
  return bindings.fpNamespaces.has(typeName.left.text) &&
    wrapperTypes.has(typeName.right.text)
    ? typeName.right.text
    : null
}

export const importedTypeAt = (ts, typeName, bindings) => {
  if (ts.isIdentifier(typeName)) return bindings.importedTypes.has(typeName.text)
  if (!ts.isQualifiedName(typeName)) return false
  let root = typeName.left
  while (ts.isQualifiedName(root)) root = root.left
  return ts.isIdentifier(root) && bindings.importedNamespaces.has(root.text)
}
