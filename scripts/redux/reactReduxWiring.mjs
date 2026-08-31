import { parseSource, resolveTypescript, walkNodes } from './typescriptAst.mjs'
const hookTypes = new Map([
  ['useDispatch', new Set(['AppDispatch'])],
  ['useSelector', new Set(['AppState', 'RootState'])],
  ['useStore', new Set(['AppStore'])],
])
const isValueImport = (clause, element) => !clause?.isTypeOnly && !element?.isTypeOnly
const lineOf = (sourceFile, node) =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
const labelOf = (context, unit, node) =>
  `${context.relativeToProject(unit.filePath)}:${lineOf(unit.sourceFile, node)}`
const exportedNames = (typescript, sourceFile) => {
  const names = new Set()
  sourceFile.statements.forEach((statement) => {
    const directlyExported = statement.modifiers?.some(
      ({ kind }) => kind === typescript.SyntaxKind.ExportKeyword
    )
    if (directlyExported && typescript.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((declaration) => {
        if (typescript.isIdentifier(declaration.name)) names.add(declaration.name.text)
      })
    }
    if (
      typescript.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      typescript.isNamedExports(statement.exportClause)
    ) {
      statement.exportClause.elements.forEach((element) =>
        names.add(element.propertyName?.text ?? element.name.text)
      )
    }
  })
  return names
}
const importsFrom = (typescript, sourceFile, moduleName) =>
  sourceFile.statements.filter(
    (statement) =>
      typescript.isImportDeclaration(statement) &&
      typescript.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === moduleName
  )
const reactBindings = (typescript, sourceFile) => {
  const hooks = []
  const providers = new Set()
  const namespaces = new Set()
  importsFrom(typescript, sourceFile, 'react-redux').forEach((statement) => {
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
        if (hookTypes.has(imported)) {
          hooks.push({ role: imported, local: element.name.text, node: element })
        }
        if (imported === 'Provider') providers.add(element.name.text)
      })
  })
  return { hooks, namespaces, providers }
}
const roleForReference = (typescript, expression, bindings) => {
  if (typescript.isIdentifier(expression)) {
    return bindings.hooks.find(({ local }) => local === expression.text)?.role ?? null
  }
  if (
    typescript.isPropertyAccessExpression(expression) &&
    typescript.isIdentifier(expression.expression) &&
    bindings.namespaces.has(expression.expression.text) &&
    hookTypes.has(expression.name.text)
  )
    return expression.name.text
  return null
}
const inspectHooks = (typescript, unit) => {
  const evidence = [...unit.bindings.hooks]
  const directCalls = []
  const typedUses = []
  const exports = exportedNames(typescript, unit.sourceFile)
  walkNodes(typescript, unit.sourceFile, (node) => {
    if (!typescript.isCallExpression(node)) return
    const directRole = roleForReference(typescript, node.expression, unit.bindings)
    if (directRole) {
      directCalls.push({ role: directRole, node })
      if (!evidence.some(({ role }) => role === directRole))
        evidence.push({ role: directRole, node })
      return
    }
    if (
      !typescript.isPropertyAccessExpression(node.expression) ||
      node.expression.name.text !== 'withTypes'
    )
      return
    const role = roleForReference(typescript, node.expression.expression, unit.bindings)
    if (!role) return
    if (!evidence.some((item) => item.role === role)) evidence.push({ role, node })
    const declaration =
      node.parent && typescript.isVariableDeclaration(node.parent) ? node.parent : null
    typedUses.push({
      role,
      node,
      name:
        declaration && typescript.isIdentifier(declaration.name)
          ? declaration.name.text
          : '',
      exported: Boolean(
        declaration &&
          typescript.isIdentifier(declaration.name) &&
          exports.has(declaration.name.text)
      ),
      type: node.typeArguments?.[0]?.getText(unit.sourceFile) ?? '',
    })
  })
  return { ...unit, evidence, directCalls, typedUses }
}
const unwrap = (typescript, node) => {
  if (!node) return null
  if (
    typescript.isParenthesizedExpression(node) ||
    typescript.isAsExpression(node) ||
    typescript.isTypeAssertionExpression(node) ||
    typescript.isNonNullExpression(node)
  )
    return unwrap(typescript, node.expression)
  return node
}
const definitionsOf = (typescript, sourceFile) => {
  const definitions = new Map()
  walkNodes(typescript, sourceFile, (node) => {
    if (typescript.isVariableDeclaration(node) && node.initializer) {
      if (typescript.isIdentifier(node.name))
        definitions.set(node.name.text, node.initializer)
      if (typescript.isArrayBindingPattern(node.name)) {
        node.name.elements.forEach((element) => {
          if (
            typescript.isBindingElement(element) &&
            typescript.isIdentifier(element.name)
          ) {
            definitions.set(element.name.text, node.initializer)
          }
        })
      }
    }
    if (typescript.isFunctionDeclaration(node) && node.name && node.body) {
      definitions.set(node.name.text, node.body)
    }
  })
  return definitions
}
const returnExpressions = (typescript, block) =>
  block.statements.flatMap((statement) =>
    typescript.isReturnStatement(statement) && statement.expression
      ? [statement.expression]
      : []
  )
const toolkitFactories = (typescript, sourceFile) => {
  const names = new Set()
  importsFrom(typescript, sourceFile, '@reduxjs/toolkit').forEach((statement) => {
    const clause = statement.importClause
    const bindings = clause?.namedBindings
    if (!bindings || !typescript.isNamedImports(bindings)) return
    bindings.elements
      .filter((element) => isValueImport(clause, element))
      .forEach((element) => {
        if ((element.propertyName?.text ?? element.name.text) === 'configureStore') {
          names.add(element.name.text)
        }
      })
  })
  return names
}
const storeExportsFor = (typescript, unit) => {
  const definitions = definitionsOf(typescript, unit.sourceFile)
  const factories = toolkitFactories(typescript, unit.sourceFile)
  const producesStore = (node, seen = new Set()) => {
    const value = unwrap(typescript, node)
    if (!value) return false
    if (typescript.isIdentifier(value)) {
      if (seen.has(value.text)) return false
      return definitions.has(value.text)
        ? producesStore(definitions.get(value.text), new Set([...seen, value.text]))
        : false
    }
    if (typescript.isCallExpression(value)) {
      if (
        typescript.isIdentifier(value.expression) &&
        factories.has(value.expression.text)
      )
        return true
      return producesStore(value.expression, seen)
    }
    if (typescript.isArrowFunction(value) || typescript.isFunctionExpression(value)) {
      return producesStore(value.body, seen)
    }
    if (typescript.isBlock(value)) {
      return returnExpressions(typescript, value).some((expression) =>
        producesStore(expression, seen)
      )
    }
    return false
  }
  const exports = exportedNames(typescript, unit.sourceFile)
  return new Set(
    [...exports].filter(
      (name) =>
        definitions.has(name) && producesStore(definitions.get(name), new Set([name]))
    )
  )
}
const rootImportsFor = (context, typescript, unit, storeExports) => {
  const names = new Set()
  const namespaces = new Map()
  unit.sourceFile.statements.forEach((statement) => {
    if (
      !typescript.isImportDeclaration(statement) ||
      !typescript.isStringLiteral(statement.moduleSpecifier)
    )
      return
    const target = context.resolveRelativeImport(
      unit.filePath,
      statement.moduleSpecifier.text
    )
    const available = target ? storeExports.get(target) : null
    const clause = statement.importClause
    if (!available || !clause || clause.isTypeOnly) return
    if (clause.name && available.has('default')) names.add(clause.name.text)
    const bindings = clause.namedBindings
    if (bindings && typescript.isNamespaceImport(bindings))
      namespaces.set(bindings.name.text, available)
    if (bindings && typescript.isNamedImports(bindings)) {
      bindings.elements
        .filter((element) => !element.isTypeOnly)
        .forEach((element) => {
          const imported = element.propertyName?.text ?? element.name.text
          if (available.has(imported)) names.add(element.name.text)
        })
    }
  })
  return { names, namespaces }
}
const providerTag = (typescript, tag, bindings) =>
  (typescript.isIdentifier(tag) && bindings.providers.has(tag.text)) ||
  (typescript.isPropertyAccessExpression(tag) &&
    typescript.isIdentifier(tag.expression) &&
    bindings.namespaces.has(tag.expression.text) &&
    tag.name.text === 'Provider')
const providerRecords = (context, typescript, units, storeExports) =>
  units.flatMap((unit) => {
    const roots = rootImportsFor(context, typescript, unit, storeExports)
    const definitions = definitionsOf(typescript, unit.sourceFile)
    const derivedFromRoot = (node, seen = new Set()) => {
      const value = unwrap(typescript, node)
      if (!value) return false
      if (typescript.isIdentifier(value)) {
        if (roots.names.has(value.text)) return true
        if (seen.has(value.text) || !definitions.has(value.text)) return false
        return derivedFromRoot(
          definitions.get(value.text),
          new Set([...seen, value.text])
        )
      }
      if (
        typescript.isPropertyAccessExpression(value) &&
        typescript.isIdentifier(value.expression)
      ) {
        return roots.namespaces.get(value.expression.text)?.has(value.name.text) ?? false
      }
      if (typescript.isCallExpression(value)) {
        if (derivedFromRoot(value.expression, seen)) return true
        const wrapper =
          typescript.isIdentifier(value.expression) &&
          ['useMemo', 'useRef', 'useState'].includes(value.expression.text)
        return Boolean(
          wrapper && value.arguments.some((argument) => derivedFromRoot(argument, seen))
        )
      }
      if (typescript.isArrowFunction(value) || typescript.isFunctionExpression(value)) {
        return derivedFromRoot(value.body, seen)
      }
      if (typescript.isBlock(value)) {
        return returnExpressions(typescript, value).some((expression) =>
          derivedFromRoot(expression, seen)
        )
      }
      return false
    }
    const records = []
    walkNodes(typescript, unit.sourceFile, (node) => {
      const opening = typescript.isJsxElement(node)
        ? node.openingElement
        : typescript.isJsxSelfClosingElement(node)
          ? node
          : null
      if (!opening || !providerTag(typescript, opening.tagName, unit.bindings)) return
      const storeAttribute = opening.attributes.properties.find(
        (attribute) =>
          typescript.isJsxAttribute(attribute) && attribute.name.text === 'store'
      )
      const expression =
        storeAttribute?.initializer &&
        typescript.isJsxExpression(storeAttribute.initializer)
          ? storeAttribute.initializer.expression
          : null
      records.push({ unit, node: opening, valid: derivedFromRoot(expression) })
    })
    return records
  })
/** Checks the Provider and single typed hook boundary. */
export const collectReactReduxWiringFindings = (context) => {
  const candidateFiles = context.sourceFiles.filter((filePath) =>
    /react-redux/.test(context.readText(filePath))
  )
  if (!candidateFiles.length) return []
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript) return ['TypeScript parser is required for React-Redux wiring checks']
  const units = candidateFiles
    .map((filePath) => {
      const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
      return { filePath, sourceFile, bindings: reactBindings(typescript, sourceFile) }
    })
    .map((unit) => inspectHooks(typescript, unit))
  const hookUnits = units.filter(({ evidence }) => evidence.length)
  if (!hookUnits.length) return []
  const findings = hookUnits.flatMap((unit) =>
    unit.directCalls.map(
      ({ role, node }) =>
        `${labelOf(context, unit, node)}: raw react-redux hook ${role} is called directly; consume the exported typed app hook`
    )
  )
  if (hookUnits.length !== 1) {
    const first = hookUnits[0]
    findings.push(
      `${labelOf(context, first, first.evidence[0].node)}: raw React-Redux hook factories must be centralized in exactly one module; found ${hookUnits.length}`
    )
  } else {
    const central = hookUnits[0]
    hookTypes.forEach((acceptedTypes, role) => {
      const uses = central.typedUses.filter((use) => use.role === role)
      const valid = uses.filter((use) => use.exported && acceptedTypes.has(use.type))
      if (valid.length !== 1) {
        const node = uses[0]?.node ?? central.evidence[0].node
        findings.push(
          `${labelOf(context, central, node)}: ${role}.withTypes must be exported exactly once with ${[...acceptedTypes].join(' or ')}`
        )
      }
    })
  }
  const storeUnits = context.storeFiles.map((filePath) => {
    const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
    return { filePath, sourceFile }
  })
  const storeExports = new Map(
    storeUnits.map((unit) => [unit.filePath, storeExportsFor(typescript, unit)])
  )
  const providers = providerRecords(context, typescript, units, storeExports)
  if (!providers.length) {
    const first = hookUnits[0]
    findings.push(
      `${labelOf(context, first, first.evidence[0].node)}: React-Redux hooks require a discoverable react-redux Provider receiving the root store`
    )
  } else if (!providers.some(({ valid }) => valid)) {
    const provider = providers[0]
    findings.push(
      `${labelOf(context, provider.unit, provider.node)}: react-redux Provider store prop must receive a root configureStore value or factory result`
    )
  }
  return findings
}
