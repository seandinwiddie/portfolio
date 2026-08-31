import {
  importedBindingsFor,
  importedCallsFor,
  isImportedCall,
  parseSource,
  propertyNamed,
  resolveTypescript,
} from './typescriptAst.mjs'

const queryModules = ['@reduxjs/toolkit/query', '@reduxjs/toolkit/query/react']

/**
 * Collects RTK Query base-API composition violations.
 * User Story: As an app maintainer, I need split endpoint domains to extend
 * one createApi root through injectEndpoints instead of rebuilding API roots.
 * @signature export const collectApiCompositionFindings = (context) => string[]
 */
export const collectApiCompositionFindings = (context) => {
  const findings = []
  const apiRoleFiles = context.sourceFiles.filter(
    (filePath) => context.roleForFile(filePath) === 'api'
  )
  const createApiRoots = rootsFor(context, apiRoleFiles)
  if (apiRoleFiles.length < 2) return findings
  if (createApiRoots.length === 0) {
    return [
      `${context.relativeToProject(context.srcRoot)}: split API domains require one app createApi root`,
    ]
  }
  if (createApiRoots.length > 1) return duplicateBaseUrlFindings(context, createApiRoots)

  const rootRecord = createApiRoots[0]
  const root = rootRecord.filePath
  const rootSource = context.readText(root)
  if (
    !hasEmptyEndpointsFactory(
      rootRecord.typescript,
      rootRecord.sourceFile,
      rootRecord.call
    )
  ) {
    findings.push(
      `${context.relativeToProject(root)}: split API createApi root must declare an empty endpoints factory`
    )
  }
  if (/\.injectEndpoints\s*\(/.test(rootSource)) {
    findings.push(
      `${context.relativeToProject(root)}: split endpoint injection belongs to feature API role files, not the createApi root`
    )
  }
  findings.push(
    ...apiRoleFiles
      .filter((filePath) => filePath !== root)
      .filter((filePath) =>
        /\.\s*(?:query|mutation)\s*(?:<|\()/.test(context.readText(filePath))
      )
      .filter((filePath) => !/\.injectEndpoints\s*\(/.test(context.readText(filePath)))
      .map(
        (filePath) =>
          `${context.relativeToProject(filePath)}: endpoint API role file must extend the app createApi root through injectEndpoints`
      )
  )
  return findings
}

export const collectApiCompositionSmells = (context) => {
  const roots = rootsFor(
    context,
    context.sourceFiles.filter((filePath) => context.roleForFile(filePath) === 'api')
  )
  return roots.length > 1 && roots.some(({ baseUrl }) => !baseUrl)
    ? [
        `${context.relativeToProject(context.srcRoot)}: multiple createApi roots include a non-literal or unresolved baseUrl; review whether they represent distinct backends`,
      ]
    : []
}

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

const hasEmptyEndpointsFactory = (typescript, sourceFile, call) => {
  if (!typescript || !sourceFile || !call) return false
  const config = unwrap(typescript, call.arguments[0])
  if (!typescript.isObjectLiteralExpression(config)) return false
  const endpoints = propertyNamed(typescript, config, sourceFile, 'endpoints')
  if (!endpoints || !typescript.isPropertyAssignment(endpoints)) return false
  const factory = unwrap(typescript, endpoints.initializer)
  if (!typescript.isArrowFunction(factory) && !typescript.isFunctionExpression(factory))
    return false
  const body = unwrap(typescript, factory.body)
  const returned = typescript.isBlock(body)
    ? body.statements.find(typescript.isReturnStatement)?.expression
    : body
  const value = unwrap(typescript, returned)
  return Boolean(
    typescript.isObjectLiteralExpression(value) && value.properties.length === 0
  )
}

const literalBaseUrl = (typescript, sourceFile, call) => {
  const config = unwrap(typescript, call.arguments[0])
  if (!typescript.isObjectLiteralExpression(config)) return null
  const baseQuery = propertyNamed(typescript, config, sourceFile, 'baseQuery')
  if (!baseQuery || !typescript.isPropertyAssignment(baseQuery)) return null
  const initializer = unwrap(typescript, baseQuery.initializer)
  const bindings = importedBindingsFor(
    typescript,
    sourceFile,
    queryModules,
    'fetchBaseQuery'
  )
  if (!isImportedCall(typescript, initializer, bindings)) return null
  const options = unwrap(typescript, initializer.arguments[0])
  if (!typescript.isObjectLiteralExpression(options)) return null
  const property = propertyNamed(typescript, options, sourceFile, 'baseUrl')
  return property &&
    typescript.isPropertyAssignment(property) &&
    typescript.isStringLiteralLike(unwrap(typescript, property.initializer))
    ? unwrap(typescript, property.initializer).text
    : null
}

const rootsFor = (context, apiRoleFiles) => {
  const typescript = resolveTypescript(context.projectRoot ?? process.cwd())
  if (!typescript) return []
  return apiRoleFiles.flatMap((filePath) => {
    const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
    const bindings = importedBindingsFor(
      typescript,
      sourceFile,
      queryModules,
      'createApi'
    )
    return importedCallsFor(typescript, sourceFile, bindings).map((call) => ({
      filePath,
      sourceFile,
      call,
      typescript,
      baseUrl: literalBaseUrl(typescript, sourceFile, call),
    }))
  })
}

const duplicateBaseUrlFindings = (context, roots) => {
  const counts = roots.reduce((byUrl, root) => {
    if (!root.baseUrl) return byUrl
    byUrl.set(root.baseUrl, (byUrl.get(root.baseUrl) ?? 0) + 1)
    return byUrl
  }, new Map())
  return roots
    .filter(({ baseUrl }) => baseUrl && (counts.get(baseUrl) ?? 0) > 1)
    .map(
      ({ filePath, baseUrl }) =>
        `${context.relativeToProject(filePath)}: more than one createApi root targets base URL ${baseUrl}; extend one root with injectEndpoints`
    )
}
