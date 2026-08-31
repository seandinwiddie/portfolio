import {
  parseSource,
  propertyNamed,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'
const isValueImport = (clause, element) => !clause?.isTypeOnly && !element?.isTypeOnly
const lineOf = (sourceFile, node) =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
const labelOf = (context, unit, node) =>
  `${context.relativeToProject(unit.filePath)}:${lineOf(unit.sourceFile, node)}`
const unwrap = (typescript, node) => {
  if (!node) return null
  if (
    typescript.isParenthesizedExpression(node) ||
    typescript.isAsExpression(node) ||
    typescript.isTypeAssertionExpression(node) ||
    typescript.isNonNullExpression(node)
  )
    return unwrap(typescript, node.expression)
  return typescript.isSpreadElement(node) ? unwrap(typescript, node.expression) : node
}
const toolkitBindings = (typescript, sourceFile) => {
  const listenerFactories = new Set()
  const storeFactories = new Set()
  const namespaces = new Set()
  sourceFile.statements.forEach((statement) => {
    if (
      !typescript.isImportDeclaration(statement) ||
      !typescript.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@reduxjs/toolkit'
    )
      return
    const clause = statement.importClause
    const bindings = clause?.namedBindings
    if (bindings && typescript.isNamespaceImport(bindings) && isValueImport(clause)) {
      namespaces.add(bindings.name.text)
    }
    if (!bindings || !typescript.isNamedImports(bindings)) return
    bindings.elements
      .filter((element) => isValueImport(clause, element))
      .forEach((element) => {
        const imported = element.propertyName?.text ?? element.name.text
        if (imported === 'createListenerMiddleware')
          listenerFactories.add(element.name.text)
        if (imported === 'configureStore') storeFactories.add(element.name.text)
      })
  })
  return { listenerFactories, namespaces, storeFactories }
}
const toolkitCall = (typescript, call, names, namespaces, member) => {
  if (!call || !typescript.isCallExpression(call)) return false
  if (typescript.isIdentifier(call.expression)) return names.has(call.expression.text)
  return (
    typescript.isPropertyAccessExpression(call.expression) &&
    typescript.isIdentifier(call.expression.expression) &&
    namespaces.has(call.expression.expression.text) &&
    call.expression.name.text === member
  )
}
const exportedNames = (typescript, sourceFile) => {
  const names = new Set()
  sourceFile.statements.forEach((statement) => {
    const direct = statement.modifiers?.some(
      ({ kind }) => kind === typescript.SyntaxKind.ExportKeyword
    )
    if (direct && typescript.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((declaration) => {
        if (typescript.isIdentifier(declaration.name)) names.add(declaration.name.text)
      })
    }
    if (
      typescript.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      typescript.isNamedExports(statement.exportClause)
    )
      statement.exportClause.elements.forEach((element) =>
        names.add(element.propertyName?.text ?? element.name.text)
      )
  })
  return names
}
const listenerInstances = (typescript, units) =>
  units.flatMap((unit) => {
    const instances = []
    walkNodes(typescript, unit.sourceFile, (node) => {
      if (
        typescript.isVariableDeclaration(node) &&
        typescript.isIdentifier(node.name) &&
        toolkitCall(
          typescript,
          node.initializer,
          unit.toolkit.listenerFactories,
          unit.toolkit.namespaces,
          'createListenerMiddleware'
        )
      )
        instances.push({ filePath: unit.filePath, name: node.name.text, node, unit })
    })
    return instances
  })
const referencesFor = (context, typescript, unit, instance) => {
  const identifiers = new Set(unit.filePath === instance.filePath ? [instance.name] : [])
  const namespaces = new Set()
  unit.sourceFile.statements.forEach((statement) => {
    if (
      !typescript.isImportDeclaration(statement) ||
      !typescript.isStringLiteral(statement.moduleSpecifier)
    )
      return
    if (
      context.resolveRelativeImport(unit.filePath, statement.moduleSpecifier.text) !==
      instance.filePath
    )
      return
    const clause = statement.importClause
    if (!clause || clause.isTypeOnly) return
    const bindings = clause.namedBindings
    if (bindings && typescript.isNamespaceImport(bindings))
      namespaces.add(bindings.name.text)
    if (bindings && typescript.isNamedImports(bindings)) {
      bindings.elements
        .filter((element) => !element.isTypeOnly)
        .forEach((element) => {
          const imported = element.propertyName?.text ?? element.name.text
          if (imported === instance.name) identifiers.add(element.name.text)
        })
    }
  })
  return { identifiers, namespaces }
}
const matchesReference = (typescript, node, references, instance) => {
  const value = unwrap(typescript, node)
  if (value && typescript.isIdentifier(value))
    return references.identifiers.has(value.text)
  return Boolean(
    value &&
      typescript.isPropertyAccessExpression(value) &&
      typescript.isIdentifier(value.expression) &&
      references.namespaces.has(value.expression.text) &&
      value.name.text === instance.name
  )
}
const definitionsOf = (typescript, sourceFile) => {
  const definitions = new Map()
  sourceFile.statements.forEach((statement) => {
    if (typescript.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((declaration) => {
        if (typescript.isIdentifier(declaration.name) && declaration.initializer) {
          definitions.set(declaration.name.text, declaration.initializer)
        }
      })
    }
    if (typescript.isFunctionDeclaration(statement) && statement.name && statement.body) {
      definitions.set(statement.name.text, statement.body)
    }
  })
  return definitions
}
const reachableWalk = (typescript, root, definitions, visit) => {
  const expanded = new Set()
  const walk = (node) => {
    visit(node)
    if (
      typescript.isIdentifier(node) &&
      definitions.has(node.text) &&
      !expanded.has(node.text)
    ) {
      expanded.add(node.text)
      walk(definitions.get(node.text))
    }
    typescript.forEachChild(node, walk)
  }
  walk(root)
}
const branchConstraints = (typescript, node) => {
  const constraints = new Map()
  let child = node
  let parent = node.parent
  while (parent) {
    if (typescript.isConditionalExpression(parent)) {
      if (child === parent.whenTrue) constraints.set(parent.pos, true)
      if (child === parent.whenFalse) constraints.set(parent.pos, false)
    }
    child = parent
    parent = parent.parent
  }
  return constraints
}
const wiringPathCounts = (occurrences) => {
  const conditions = [
    ...new Set(occurrences.flatMap(({ constraints }) => [...constraints.keys()])),
  ]
  const counts = (items, remaining) => {
    if (!remaining.length) return [items.length]
    const [condition, ...rest] = remaining
    return [true, false].flatMap((branch) =>
      counts(
        items.filter(
          ({ constraints }) =>
            !constraints.has(condition) || constraints.get(condition) === branch
        ),
        rest
      )
    )
  }
  return counts(occurrences, conditions)
}
const middlewareRoots = (typescript, unit) => {
  const definitions = definitionsOf(typescript, unit.sourceFile)
  const roots = []
  walkNodes(typescript, unit.sourceFile, (node) => {
    if (
      !toolkitCall(
        typescript,
        node,
        unit.toolkit.storeFactories,
        unit.toolkit.namespaces,
        'configureStore'
      )
    )
      return
    const rawConfig = unwrap(typescript, node.arguments[0])
    const config =
      rawConfig && typescript.isIdentifier(rawConfig)
        ? unwrap(typescript, definitions.get(rawConfig.text))
        : rawConfig
    if (!config || !typescript.isObjectLiteralExpression(config)) return
    const middleware = propertyNamed(typescript, config, unit.sourceFile, 'middleware')
    if (middleware && typescript.isPropertyAssignment(middleware))
      roots.push(middleware.initializer)
    if (middleware && typescript.isShorthandPropertyAssignment(middleware))
      roots.push(middleware.name)
    if (middleware && typescript.isMethodDeclaration(middleware)) roots.push(middleware)
  })
  return { definitions, roots }
}
const wiringOccurrences = (context, typescript, storeUnits, instance) => {
  const occurrences = storeUnits.flatMap((unit) => {
    const references = referencesFor(context, typescript, unit, instance)
    const { definitions, roots } = middlewareRoots(typescript, unit)
    const occurrences = []
    roots.forEach((root) =>
      reachableWalk(typescript, root, definitions, (node) => {
        if (
          !typescript.isCallExpression(node) ||
          !typescript.isPropertyAccessExpression(node.expression) ||
          !['concat', 'prepend'].includes(node.expression.name.text)
        )
          return
        node.arguments
          .filter((argument) => {
            const value = unwrap(typescript, argument)
            return (
              value &&
              typescript.isPropertyAccessExpression(value) &&
              value.name.text === 'middleware' &&
              matchesReference(typescript, value.expression, references, instance)
            )
          })
          .forEach(() =>
            occurrences.push({
              constraints: branchConstraints(typescript, node),
              method: node.expression.name.text,
              node,
              unit,
            })
          )
      })
    )
    return occurrences
  })
  return occurrences
}
const exportedStartBindings = (context, typescript, units, instance) =>
  units.flatMap((unit) => {
    const references = referencesFor(context, typescript, unit, instance)
    const exports = exportedNames(typescript, unit.sourceFile)
    const bindings = []
    walkNodes(typescript, unit.sourceFile, (node) => {
      if (
        !typescript.isVariableDeclaration(node) ||
        !typescript.isIdentifier(node.name) ||
        !node.initializer ||
        !exports.has(node.name.text)
      )
        return
      let usesStart = false
      walkNodes(typescript, node.initializer, (child) => {
        const value = unwrap(typescript, child)
        if (
          value &&
          typescript.isPropertyAccessExpression(value) &&
          value.name.text === 'startListening' &&
          matchesReference(typescript, value.expression, references, instance)
        )
          usesStart = true
      })
      if (!usesStart) return
      const value = unwrap(typescript, node.initializer)
      const withTypes =
        value &&
        typescript.isCallExpression(value) &&
        typescript.isPropertyAccessExpression(value.expression) &&
        value.expression.name.text === 'withTypes'
          ? value.expression.expression
          : null
      const correct = Boolean(
        withTypes &&
          typescript.isPropertyAccessExpression(withTypes) &&
          withTypes.name.text === 'startListening' &&
          matchesReference(typescript, withTypes.expression, references, instance) &&
          value.typeArguments?.length === 2 &&
          value.typeArguments[0].getText(unit.sourceFile) === 'AppState' &&
          value.typeArguments[1].getText(unit.sourceFile) === 'AppDispatch'
      )
      bindings.push({ correct, node, unit })
    })
    return bindings
  })
/** Checks listener store placement and its typed registration boundary. */
export const collectListenerWiringFindings = (context) => {
  const candidates = context.sourceFiles.filter((filePath) =>
    /createListenerMiddleware/.test(context.readText(filePath))
  )
  if (!candidates.length) return []
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript)
    return ['TypeScript parser is required for listener middleware wiring checks']
  const relevantFiles = [...new Set([...context.sourceFiles, ...context.storeFiles])]
  const units = relevantFiles.map((filePath) => {
    const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
    return { filePath, sourceFile, toolkit: toolkitBindings(typescript, sourceFile) }
  })
  const stores = units.filter(({ filePath }) => context.storeFiles.includes(filePath))
  return listenerInstances(typescript, units).flatMap((instance) => {
    const label = labelOf(context, instance.unit, instance.node)
    const occurrences = wiringOccurrences(context, typescript, stores, instance)
    const pathCounts = wiringPathCounts(occurrences)
    const starts = exportedStartBindings(context, typescript, units, instance)
    return [
      ...(pathCounts.every((count) => count === 1)
        ? []
        : [
            `${label}: listener middleware ${instance.name} must be wired exactly once into the root configureStore middleware; found ${[...new Set(pathCounts)].join(' or ')}`,
          ]),
      ...occurrences
        .filter(({ method }) => method === 'concat')
        .map(
          ({ unit, node }) =>
            `${labelOf(context, unit, node)}: listener middleware ${instance.name} must use prepend, never concat`
        ),
      ...(!starts.length
        ? [
            `${label}: listener middleware ${instance.name} must export startListening.withTypes<AppState, AppDispatch>()`,
          ]
        : starts
            .filter(({ correct }) => !correct)
            .map(
              ({ unit, node }) =>
                `${labelOf(context, unit, node)}: exported startListening for ${instance.name} must use ${instance.name}.startListening.withTypes<AppState, AppDispatch>() instead of a type assertion`
            )),
    ]
  })
}
