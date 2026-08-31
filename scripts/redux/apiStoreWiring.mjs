import {
  importedBindingsFor,
  isImportedCall,
  parseSource,
  propertyNamed,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'

const queryModules = ['@reduxjs/toolkit/query', '@reduxjs/toolkit/query/react']

const unwrap = (typescript, node) => {
  let current = node
  while (
    current &&
    (typescript.isParenthesizedExpression(current) ||
      typescript.isAsExpression(current) ||
      typescript.isTypeAssertionExpression(current) ||
      (typescript.isSatisfiesExpression?.(current) ?? false))
  )
    current = current.expression
  return current
}

const createApiDeclarations = (context, typescript) =>
  context.apiFiles.flatMap((filePath) => {
    const text = context.readText(filePath)
    const sourceFile = parseSource(typescript, filePath, text)
    const bindings = importedBindingsFor(
      typescript,
      sourceFile,
      queryModules,
      'createApi'
    )
    const declarations = []
    walkNodes(typescript, sourceFile, (node) => {
      if (
        typescript.isVariableDeclaration(node) &&
        typescript.isIdentifier(node.name) &&
        node.initializer &&
        isImportedCall(typescript, unwrap(typescript, node.initializer), bindings)
      ) {
        declarations.push({
          filePath,
          name: node.name.text,
          line:
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        })
      }
    })
    return declarations
  })

const localApiNames = (context, typescript, storeFile, apiDeclaration, sourceFile) => {
  if (storeFile === apiDeclaration.filePath) return [apiDeclaration.name]
  const names = []
  sourceFile.statements.forEach((statement) => {
    if (
      !typescript.isImportDeclaration(statement) ||
      !typescript.isStringLiteral(statement.moduleSpecifier) ||
      context.resolveRelativeImport(storeFile, statement.moduleSpecifier.text) !==
        apiDeclaration.filePath
    )
      return
    const bindings = statement.importClause?.namedBindings
    if (bindings && typescript.isNamedImports(bindings)) {
      bindings.elements.forEach((element) => {
        const imported = element.propertyName?.text ?? element.name.text
        if (imported === apiDeclaration.name) names.push(element.name.text)
      })
    }
    if (statement.importClause?.name && apiDeclaration.name === 'default') {
      names.push(statement.importClause.name.text)
    }
  })
  return names
}

const definitionsOf = (typescript, sourceFile) => {
  const definitions = new Map()
  sourceFile.statements.forEach((statement) => {
    if (!typescript.isVariableStatement(statement)) return
    statement.declarationList.declarations.forEach((declaration) => {
      if (typescript.isIdentifier(declaration.name) && declaration.initializer) {
        definitions.set(declaration.name.text, declaration.initializer)
      }
    })
  })
  return definitions
}

const subtreeUsesMember = (typescript, root, localNames, member, definitions) => {
  let found = false
  const expanded = new Set()
  const visit = (node) => {
    if (
      typescript.isPropertyAccessExpression(node) &&
      typescript.isIdentifier(node.expression) &&
      localNames.includes(node.expression.text) &&
      node.name.text === member
    )
      found = true
    if (
      typescript.isIdentifier(node) &&
      definitions.has(node.text) &&
      !expanded.has(node.text)
    ) {
      expanded.add(node.text)
      visit(definitions.get(node.text))
    }
    typescript.forEachChild(node, visit)
  }
  visit(root)
  return found
}

const configureStoreObjects = (typescript, sourceFile) => {
  const bindings = importedBindingsFor(
    typescript,
    sourceFile,
    ['@reduxjs/toolkit'],
    'configureStore'
  )
  const objects = []
  walkNodes(typescript, sourceFile, (node) => {
    if (!isImportedCall(typescript, node, bindings)) return
    const config = unwrap(typescript, node.arguments[0])
    if (config && typescript.isObjectLiteralExpression(config)) objects.push(config)
  })
  return objects
}

const wiringFor = (typescript, sourceFile, configs, localNames) => {
  const definitions = definitionsOf(typescript, sourceFile)
  return configs.reduce(
    (result, config) => {
      const reducer = propertyNamed(typescript, config, sourceFile, 'reducer')
      const middleware = propertyNamed(typescript, config, sourceFile, 'middleware')
      return {
        reducer:
          result.reducer ||
          Boolean(
            reducer &&
              subtreeUsesMember(typescript, reducer, localNames, 'reducer', definitions)
          ),
        middleware:
          result.middleware ||
          Boolean(
            middleware &&
              subtreeUsesMember(
                typescript,
                middleware,
                localNames,
                'middleware',
                definitions
              )
          ),
      }
    },
    { reducer: false, middleware: false }
  )
}

/**
 * Ensures every createApi root is connected to both RTK Query store seams.
 * @signature export const collectApiStoreWiringFindings = (context) => string[]
 */
export const collectApiStoreWiringFindings = (context) => {
  if (!context.apiFiles.length) return []
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript)
    return ['TypeScript parser is required for RTK Query store wiring checks']
  const storeFile = context.storeFiles.length === 1 ? context.storeFiles[0] : null
  if (!storeFile) return []
  const storeText = context.readText(storeFile)
  const sourceFile = parseSource(typescript, storeFile, storeText)
  const configs = configureStoreObjects(typescript, sourceFile)
  return createApiDeclarations(context, typescript).flatMap((apiDeclaration) => {
    const localNames = localApiNames(
      context,
      typescript,
      storeFile,
      apiDeclaration,
      sourceFile
    )
    const wiring = wiringFor(typescript, sourceFile, configs, localNames)
    const apiLabel = `${context.relativeToProject(apiDeclaration.filePath)}:${apiDeclaration.line}`
    return [
      ...(wiring.reducer
        ? []
        : [
            `${apiLabel}: createApi ${apiDeclaration.name} reducer is not wired into the app root configureStore reducer`,
          ]),
      ...(wiring.middleware
        ? []
        : [
            `${apiLabel}: createApi ${apiDeclaration.name} middleware is not wired into the app root configureStore middleware`,
          ]),
    ]
  })
}
