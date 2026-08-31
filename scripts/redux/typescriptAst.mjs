import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const cache = new Map()

const searchDirectories = (startDirectory) => {
  const directories = []
  let current = path.resolve(startDirectory)
  for (;;) {
    directories.push(current)
    const parent = path.dirname(current)
    if (parent === current) return directories
    current = parent
  }
}

export const resolveTypescript = (projectRoot) => {
  if (cache.has(projectRoot)) return cache.get(projectRoot)
  const directories = [
    ...searchDirectories(projectRoot),
    ...searchDirectories(process.cwd()),
    path.dirname(fileURLToPath(import.meta.url)),
  ]
  const typescript = [...new Set(directories)].reduce((found, directory) => {
    if (found) return found
    try {
      return require(require.resolve('typescript', { paths: [directory] }))
    } catch {
      return null
    }
  }, null)
  cache.set(projectRoot, typescript)
  return typescript
}

const scriptKindFor = (typescript, filename) => {
  const extension = path.extname(filename).toLowerCase()
  if (['.js', '.jsx', '.mjs', '.cjs'].includes(extension)) return typescript.ScriptKind.JS
  return extension === '.tsx' ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS
}

export const parseSource = (typescript, filename, code) =>
  typescript.createSourceFile(
    filename,
    code,
    typescript.ScriptTarget.Latest,
    true,
    scriptKindFor(typescript, filename)
  )

export const walkNodes = (typescript, root, visit) => {
  const walk = (node) => {
    visit(node)
    typescript.forEachChild(node, walk)
  }
  walk(root)
}

export const nodeName = (typescript, node, sourceFile) => {
  if (!node) return ''
  if (
    typescript.isIdentifier(node) ||
    typescript.isStringLiteral(node) ||
    typescript.isNumericLiteral(node)
  )
    return node.text
  return node.getText(sourceFile)
}

export const propertyNamed = (typescript, objectLiteral, sourceFile, name) =>
  objectLiteral?.properties?.find(
    (property) => nodeName(typescript, property.name, sourceFile) === name
  ) ?? null

export const importedBindingsFor = (
  typescript,
  sourceFile,
  moduleSpecifiers,
  importedName
) => {
  const modules = new Set(moduleSpecifiers)
  const identifiers = new Set()
  const namespaces = new Set()
  sourceFile.statements
    .filter(typescript.isImportDeclaration)
    .filter((statement) => typescript.isStringLiteral(statement.moduleSpecifier))
    .filter((statement) => modules.has(statement.moduleSpecifier.text))
    .forEach((statement) => {
      const bindings = statement.importClause?.namedBindings
      if (bindings && typescript.isNamedImports(bindings)) {
        bindings.elements
          .filter(
            (element) =>
              (element.propertyName?.text ?? element.name.text) === importedName
          )
          .forEach((element) => identifiers.add(element.name.text))
      } else if (bindings && typescript.isNamespaceImport(bindings)) {
        namespaces.add(bindings.name.text)
      }
    })
  return { identifiers, namespaces, importedName }
}

const bindingNameContains = (typescript, bindingName, name) => {
  if (typescript.isIdentifier(bindingName)) return bindingName.text === name
  return (
    bindingName.elements?.some(
      (element) => element.name && bindingNameContains(typescript, element.name, name)
    ) ?? false
  )
}

const statementDeclares = (typescript, statement, name) => {
  if (typescript.isVariableStatement(statement)) {
    return statement.declarationList.declarations.some((declaration) =>
      bindingNameContains(typescript, declaration.name, name)
    )
  }
  return (
    (typescript.isFunctionDeclaration(statement) ||
      typescript.isClassDeclaration(statement)) &&
    statement.name?.text === name
  )
}

const bindingIsShadowed = (typescript, node, name) => {
  let current = node.parent
  while (current && !typescript.isSourceFile(current)) {
    if (
      (typescript.isFunctionLike(current) || typescript.isMethodDeclaration(current)) &&
      (current.parameters.some((parameter) =>
        bindingNameContains(typescript, parameter.name, name)
      ) ||
        current.name?.text === name)
    )
      return true
    if (
      (typescript.isBlock(current) || typescript.isModuleBlock(current)) &&
      current.statements.some((statement) =>
        statementDeclares(typescript, statement, name)
      )
    )
      return true
    if (
      typescript.isCatchClause(current) &&
      current.variableDeclaration &&
      bindingNameContains(typescript, current.variableDeclaration.name, name)
    )
      return true
    if (
      (typescript.isForStatement(current) ||
        typescript.isForInStatement(current) ||
        typescript.isForOfStatement(current)) &&
      current.initializer &&
      typescript.isVariableDeclarationList(current.initializer) &&
      current.initializer.declarations.some((declaration) =>
        bindingNameContains(typescript, declaration.name, name)
      )
    )
      return true
    current = current.parent
  }
  return false
}

export const isImportedCall = (typescript, node, bindings) => {
  if (!node || !typescript.isCallExpression(node)) return false
  if (typescript.isIdentifier(node.expression)) {
    return (
      bindings.identifiers.has(node.expression.text) &&
      !bindingIsShadowed(typescript, node, node.expression.text)
    )
  }
  return (
    typescript.isPropertyAccessExpression(node.expression) &&
    typescript.isIdentifier(node.expression.expression) &&
    bindings.namespaces.has(node.expression.expression.text) &&
    !bindingIsShadowed(typescript, node, node.expression.expression.text) &&
    node.expression.name.text === bindings.importedName
  )
}

export const importedCallsFor = (typescript, sourceFile, bindings) => {
  const calls = []
  walkNodes(typescript, sourceFile, (node) => {
    if (isImportedCall(typescript, node, bindings)) calls.push(node)
  })
  return calls
}
