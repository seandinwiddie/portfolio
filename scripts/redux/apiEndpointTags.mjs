import {
  importedBindingsFor,
  isImportedCall,
  nodeName,
  parseSource,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'
import { roleForSpecifier } from './roleRules.mjs'
import { skillFileOf } from '../skill-paths.mjs'

const queryModules = ['@reduxjs/toolkit/query', '@reduxjs/toolkit/query/react']
const tagNames = new Set(['providesTags', 'invalidatesTags'])
const skill = 'manage-server-data/adopt-rtk-query'
const skillFile = skillFileOf('manage-server-data-adopt-rtk-query')
const reference = 'https://redux-toolkit.js.org/rtk-query/usage/automated-refetching'

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

const bindingsFor = (typescript, sourceFile) => {
  const bindings = new Map()
  walkNodes(typescript, sourceFile, (node) => {
    if (
      typescript.isVariableDeclaration(node) &&
      typescript.isIdentifier(node.name) &&
      node.initializer
    )
      bindings.set(node.name.text, node.initializer)
    if (typescript.isFunctionDeclaration(node) && node.name) {
      bindings.set(node.name.text, node)
    }
  })
  return bindings
}

const resolveLocal = (typescript, node, bindings, seen = new Set()) => {
  const value = unwrap(typescript, node)
  if (!value || !typescript.isIdentifier(value) || seen.has(value.text)) return value
  const initializer = bindings.get(value.text)
  return initializer
    ? resolveLocal(typescript, initializer, bindings, new Set([...seen, value.text]))
    : value
}

const propertiesNamed = (
  typescript,
  object,
  sourceFile,
  bindings,
  name,
  seen = new Set()
) => {
  const value = resolveLocal(typescript, object, bindings, seen)
  if (!value || !typescript.isObjectLiteralExpression(value) || seen.has(value)) {
    return { values: [], unresolved: true }
  }
  const nextSeen = new Set([...seen, value])
  const values = []
  let unresolved = false
  value.properties.forEach((property) => {
    if (typescript.isSpreadAssignment(property)) {
      const nested = propertiesNamed(
        typescript,
        property.expression,
        sourceFile,
        bindings,
        name,
        nextSeen
      )
      values.push(...nested.values)
      unresolved ||= nested.unresolved
    } else if (nodeName(typescript, property.name, sourceFile) === name) {
      if (typescript.isPropertyAssignment(property)) values.push(property.initializer)
      else if (typescript.isShorthandPropertyAssignment(property))
        values.push(property.name)
      else if (typescript.isMethodDeclaration(property)) values.push(property)
      else unresolved = true
    }
  })
  return { values, unresolved }
}

const tagStatus = (typescript, config, sourceFile, bindings, seen = new Set()) => {
  const value = resolveLocal(typescript, config, bindings)
  if (!value || !typescript.isObjectLiteralExpression(value) || seen.has(value))
    return 'unresolved'
  const nextSeen = new Set([...seen, value])
  let unresolved = false
  for (const property of value.properties) {
    if (typescript.isSpreadAssignment(property)) {
      const nested = tagStatus(
        typescript,
        property.expression,
        sourceFile,
        bindings,
        nextSeen
      )
      if (nested === 'tagged') return 'tagged'
      unresolved ||= nested === 'unresolved'
    } else if (tagNames.has(nodeName(typescript, property.name, sourceFile))) {
      return 'tagged'
    }
  }
  return unresolved ? 'unresolved' : 'missing'
}

const returnedExpressions = (typescript, factory) => {
  const body = unwrap(typescript, factory.body)
  if (!typescript.isBlock(body)) return body ? [body] : []
  const expressions = []
  const visit = (node) => {
    if (
      node !== body &&
      (typescript.isFunctionDeclaration(node) ||
        typescript.isFunctionExpression(node) ||
        typescript.isArrowFunction(node))
    )
      return
    if (typescript.isReturnStatement(node) && node.expression)
      expressions.push(node.expression)
    typescript.forEachChild(node, visit)
  }
  visit(body)
  return expressions
}

const reviewFor = (context, filePath, sourceFile, node, summary) => ({
  level: 'REVIEW',
  skill,
  skillFile,
  reference,
  guidance: `${context.relativeToProject(filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: ${summary}; review providesTags or invalidatesTags explicitly.`,
})

const inspectFactory = (context, typescript, filePath, sourceFile, factory, bindings) => {
  const builder = factory.parameters[0]?.name
  if (!builder || !typescript.isIdentifier(builder)) {
    const returned = returnedExpressions(typescript, factory).map((expression) =>
      resolveLocal(typescript, expression, bindings)
    )
    if (
      returned.length &&
      returned.every(
        (value) =>
          typescript.isObjectLiteralExpression(value) && value.properties.length === 0
      )
    ) {
      return { findings: [], reviews: [] }
    }
    return {
      findings: [],
      reviews: [
        reviewFor(
          context,
          filePath,
          sourceFile,
          factory,
          'endpoint builder parameter is not statically resolvable'
        ),
      ],
    }
  }
  const calls = []
  const visit = (node) => {
    const nestedFunction =
      node !== factory.body &&
      (typescript.isArrowFunction(node) ||
        typescript.isFunctionExpression(node) ||
        typescript.isFunctionDeclaration(node))
    if (
      nestedFunction &&
      node.parameters.some(
        (parameter) =>
          typescript.isIdentifier(parameter.name) && parameter.name.text === builder.text
      )
    )
      return
    if (
      typescript.isCallExpression(node) &&
      typescript.isPropertyAccessExpression(node.expression) &&
      typescript.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === builder.text &&
      ['query', 'mutation'].includes(node.expression.name.text)
    )
      calls.push(node)
    typescript.forEachChild(node, visit)
  }
  visit(factory.body)
  const records = calls.map((call) => ({
    call,
    status: tagStatus(typescript, call.arguments[0], sourceFile, bindings),
  }))
  const unresolvedReturn =
    calls.length === 0 &&
    returnedExpressions(typescript, factory).some(
      (expression) =>
        !typescript.isObjectLiteralExpression(
          resolveLocal(typescript, expression, bindings)
        )
    )
  return {
    findings: records
      .filter(({ status }) => status === 'missing')
      .map(({ call }) => {
        const location = sourceFile.getLineAndCharacterOfPosition(
          call.getStart(sourceFile)
        )
        return `${context.relativeToProject(filePath)}:${location.line + 1}:${location.character + 1}`
      }),
    reviews: [
      ...records
        .filter(({ status }) => status === 'unresolved')
        .map(({ call }) =>
          reviewFor(
            context,
            filePath,
            sourceFile,
            call,
            'endpoint config is not statically resolvable'
          )
        ),
      ...(unresolvedReturn
        ? [
            reviewFor(
              context,
              filePath,
              sourceFile,
              factory,
              'endpoint factory delegates dynamically'
            ),
          ]
        : []),
    ],
  }
}

const inspectFile = (context, typescript, filePath) => {
  const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
  const bindings = bindingsFor(typescript, sourceFile)
  const createApiBindings = importedBindingsFor(
    typescript,
    sourceFile,
    queryModules,
    'createApi'
  )
  const apiReceivers = new Set()
  const apiNamespaces = new Set()
  sourceFile.statements
    .filter(typescript.isImportDeclaration)
    .filter((statement) => typescript.isStringLiteral(statement.moduleSpecifier))
    .filter((statement) => {
      const specifier = statement.moduleSpecifier.text
      const target = context.resolveRelativeImport?.(filePath, specifier)
      return target
        ? context.roleForFile(target) === 'api'
        : roleForSpecifier(specifier) === 'api'
    })
    .forEach((statement) => {
      if (statement.importClause?.name) apiReceivers.add(statement.importClause.name.text)
      const named = statement.importClause?.namedBindings
      if (named && typescript.isNamedImports(named)) {
        named.elements.forEach((element) => apiReceivers.add(element.name.text))
      } else if (named && typescript.isNamespaceImport(named)) {
        apiNamespaces.add(named.name.text)
      }
    })
  walkNodes(typescript, sourceFile, (node) => {
    if (
      typescript.isVariableDeclaration(node) &&
      typescript.isIdentifier(node.name) &&
      isImportedCall(typescript, unwrap(typescript, node.initializer), createApiBindings)
    )
      apiReceivers.add(node.name.text)
  })
  const definitions = []
  walkNodes(typescript, sourceFile, (node) => {
    const injection =
      typescript.isCallExpression(node) &&
      typescript.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'injectEndpoints' &&
      ((typescript.isIdentifier(node.expression.expression) &&
        apiReceivers.has(node.expression.expression.text)) ||
        (typescript.isPropertyAccessExpression(node.expression.expression) &&
          typescript.isIdentifier(node.expression.expression.expression) &&
          apiNamespaces.has(node.expression.expression.expression.text)))
    if (isImportedCall(typescript, node, createApiBindings) || injection)
      definitions.push(node)
  })
  return definitions.flatMap((definition) => {
    const configs = propertiesNamed(
      typescript,
      definition.arguments[0],
      sourceFile,
      bindings,
      'endpoints'
    )
    const factories = configs.values
      .map((value) => resolveLocal(typescript, value, bindings))
      .filter(
        (value) =>
          typescript.isArrowFunction(value) ||
          typescript.isFunctionExpression(value) ||
          typescript.isFunctionDeclaration(value)
      )
    const analyses = factories.map((factory) =>
      inspectFactory(context, typescript, filePath, sourceFile, factory, bindings)
    )
    const unresolved = configs.unresolved || factories.length !== configs.values.length
    return [
      ...analyses,
      ...(unresolved
        ? [
            {
              findings: [],
              reviews: [
                reviewFor(
                  context,
                  filePath,
                  sourceFile,
                  definition,
                  'endpoint definition is not statically resolvable'
                ),
              ],
            },
          ]
        : []),
    ]
  })
}

/** Select every API role file that may own query or mutation definitions. */
export const selectEndpointApiFiles = (context) =>
  context.sourceFiles.filter((filePath) => context.roleForFile(filePath) === 'api')

export const collectApiEndpointTagAnalysis = (context) => {
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript) return { parserMissing: true, findings: [], reviews: [] }
  const analyses = selectEndpointApiFiles(context).flatMap((filePath) =>
    inspectFile(context, typescript, filePath)
  )
  return {
    parserMissing: false,
    findings: [...new Set(analyses.flatMap(({ findings }) => findings))],
    reviews: [
      ...new Map(
        analyses
          .flatMap(({ reviews }) => reviews)
          .map((review) => [review.guidance, review])
      ).values(),
    ],
  }
}

export const checkApiEndpointTags = (context, fail) => {
  if (!context.apiFiles.length) {
    console.log('[skip] No createApi files discovered')
    return []
  }
  const analysis = collectApiEndpointTagAnalysis(context)
  if (analysis.parserMissing)
    fail('Could not resolve TypeScript parser for RTK Query endpoint analysis')
  else if (analysis.findings.length) {
    fail('RTK Query endpoints missing tag declarations:', analysis.findings)
  } else
    console.log('[ok] All statically resolved RTK Query endpoints have tag declarations')
  return analysis.reviews
}
