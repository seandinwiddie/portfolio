import path from 'node:path'

import { parseSource, resolveTypescript, walkNodes } from './typescriptAst.mjs'

const jsonExtensionPattern = /\.json$/iu
const testPathPattern = /(?:^|\/)(?:__tests__\/|[^/]+\.(?:test|spec|stories)\.)/u
const localAuthorityPattern =
  /^src\/(?:data|content|fixtures|mocks|seeds|authored[-_]?data|local[-_]?data)(?:\/|$)/iu
const localAssetAuthorityPattern = /^src\/assets\/(?:data|content)(?:\/|$)/iu
const systemApiPath = 'src/features/systems/substrate/kernel/api'
const systemApiPattern = /^src\/features\/systems\/substrate\/kernel\/api(?:\/|$)/u
const approvedNetworkRolePattern = /(?:Api|Adapters)\.(?:[cm]?[jt]sx?)$/u
const governedPresentationSystemPattern =
  /^src\/features\/systems\/(?:substrate\/ui\/presentation\/signalMeta|registry\/(?:dossier\/(?:ingress|nexus)|observatory\/signalArray|wayfinding\/lostSignal)|bridge\/chassis\/utilityRail)(?:\/|$)/u
const authoredIdentityPattern = /(?:\bSean(?:\s+Dinwiddie)?\b|seandinwiddie|sdin\.dev)/iu
const absoluteDestinationPattern = /^https?:\/\//iu
const productionViewPattern = /^src\/views\/.*\.tsx$/u
const presentationAttributeNames = new Set([
  'accessibilityHint',
  'accessibilityLabel',
  'alt',
  'aria-description',
  'aria-label',
  'description',
  'label',
  'legend',
  'placeholder',
  'title',
])
const requiredApiRoutes = [
  '/data',
  '/github',
  '/github/commits',
  '/observatory',
  '/presence',
  '/status',
]

const toPosix = (filePath) => filePath.split(path.sep).join('/')
const relativeToProject = (context, filePath) =>
  toPosix(path.relative(context.projectRoot, filePath))

const sourceTargetFor = (context, fromFile) => (specifier) => {
  const absolute = specifier.startsWith('.')
    ? path.resolve(path.dirname(fromFile), specifier)
    : specifier.startsWith('@/')
      ? path.resolve(context.projectRoot, 'src', specifier.slice(2))
      : specifier.startsWith('src/')
        ? path.resolve(context.projectRoot, specifier)
        : null

  return absolute ? relativeToProject(context, absolute) : null
}

const isLocalAuthority = (target) =>
  localAuthorityPattern.test(target) || localAssetAuthorityPattern.test(target)

const isJsonUnderSource = (target) =>
  target.startsWith('src/') && jsonExtensionPattern.test(target)

const importClauseHasRuntime = (typescript, clause) => {
  if (!clause) return true
  if (clause.isTypeOnly) return false
  if (clause.name) return true
  if (typescript.isNamespaceImport(clause.namedBindings)) return true
  return clause.namedBindings?.elements.some((element) => !element.isTypeOnly) ?? false
}

const exportDeclarationHasRuntime = (typescript, declaration) => {
  if (declaration.isTypeOnly) return false
  if (!declaration.exportClause) return true
  if (typescript.isNamespaceExport(declaration.exportClause)) return true
  return declaration.exportClause.elements.some((element) => !element.isTypeOnly)
}

const staticModuleReference = (typescript, statement) => {
  if (
    typescript.isImportDeclaration(statement) &&
    typescript.isStringLiteral(statement.moduleSpecifier) &&
    importClauseHasRuntime(typescript, statement.importClause)
  ) {
    return { specifier: statement.moduleSpecifier.text, node: statement.moduleSpecifier }
  }
  if (
    typescript.isExportDeclaration(statement) &&
    statement.moduleSpecifier &&
    typescript.isStringLiteral(statement.moduleSpecifier) &&
    exportDeclarationHasRuntime(typescript, statement)
  ) {
    return { specifier: statement.moduleSpecifier.text, node: statement.moduleSpecifier }
  }
  if (
    typescript.isImportEqualsDeclaration(statement) &&
    !statement.isTypeOnly &&
    typescript.isExternalModuleReference(statement.moduleReference) &&
    statement.moduleReference.expression &&
    typescript.isStringLiteral(statement.moduleReference.expression)
  ) {
    return {
      specifier: statement.moduleReference.expression.text,
      node: statement.moduleReference.expression,
    }
  }
  return null
}

const dynamicModuleReference = (typescript, node) => {
  if (!typescript.isCallExpression(node)) return null
  const first = node.arguments[0]
  if (!first || !typescript.isStringLiteral(first)) return null
  const dynamicImport = node.expression.kind === typescript.SyntaxKind.ImportKeyword
  const requireCall =
    typescript.isIdentifier(node.expression) && node.expression.text === 'require'
  return dynamicImport || requireCall ? { specifier: first.text, node: first } : null
}

const runtimeModuleReferences = (typescript, sourceFile) => {
  const staticReferences = sourceFile.statements
    .map((statement) => staticModuleReference(typescript, statement))
    .filter(Boolean)
  const dynamicReferences = []
  walkNodes(typescript, sourceFile, (node) => {
    const reference = dynamicModuleReference(typescript, node)
    if (reference) dynamicReferences.push(reference)
  })
  return [...staticReferences, ...dynamicReferences].sort(
    (left, right) => left.node.getStart(sourceFile) - right.node.getStart(sourceFile)
  )
}

const bindingNameContains = (typescript, bindingName, name) =>
  typescript.isIdentifier(bindingName)
    ? bindingName.text === name
    : (bindingName.elements?.some((element) =>
        element.name ? bindingNameContains(typescript, element.name, name) : false
      ) ?? false)

const statementDeclares = (typescript, statement, name) =>
  typescript.isVariableStatement(statement)
    ? statement.declarationList.declarations.some((declaration) =>
        bindingNameContains(typescript, declaration.name, name)
      )
    : (typescript.isFunctionDeclaration(statement) ||
        typescript.isClassDeclaration(statement)) &&
      statement.name?.text === name

const bindingIsShadowed = (typescript, sourceFile, node, name) => {
  let current = node.parent
  while (current && !typescript.isSourceFile(current)) {
    if (
      (typescript.isFunctionLike(current) || typescript.isMethodDeclaration(current)) &&
      (current.parameters.some((parameter) =>
        bindingNameContains(typescript, parameter.name, name)
      ) ||
        current.name?.text === name)
    ) {
      return true
    }
    if (
      (typescript.isBlock(current) || typescript.isModuleBlock(current)) &&
      current.statements.some((statement) =>
        statementDeclares(typescript, statement, name)
      )
    ) {
      return true
    }
    current = current.parent
  }
  return sourceFile.statements.some((statement) =>
    statementDeclares(typescript, statement, name)
  )
}

const isDirectFetchCall = (typescript, sourceFile, node) => {
  if (!typescript.isCallExpression(node)) return false
  if (
    typescript.isIdentifier(node.expression) &&
    node.expression.text === 'fetch' &&
    !bindingIsShadowed(typescript, sourceFile, node, 'fetch')
  ) {
    return true
  }
  return (
    typescript.isPropertyAccessExpression(node.expression) &&
    typescript.isIdentifier(node.expression.expression) &&
    ['global', 'globalThis', 'window'].includes(node.expression.expression.text) &&
    node.expression.name.text === 'fetch'
  )
}

const isUnboundAxiosCall = (typescript, sourceFile, node) => {
  if (!typescript.isCallExpression(node)) return false
  const identifier = typescript.isIdentifier(node.expression)
    ? node.expression
    : typescript.isPropertyAccessExpression(node.expression) &&
        typescript.isIdentifier(node.expression.expression)
      ? node.expression.expression
      : null
  return Boolean(
    identifier?.text === 'axios' &&
      !bindingIsShadowed(typescript, sourceFile, node, 'axios')
  )
}

const isApprovedNetworkBoundary = (context, filePath) => {
  const relative = relativeToProject(context, filePath)
  return systemApiPattern.test(relative) && approvedNetworkRolePattern.test(relative)
}

const locationOf = (context, sourceFile, node) => {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return `${context.relativeToProject(sourceFile.fileName)}:${location.line + 1}`
}

const moduleReferenceFindings = (context, sourceFile, references) => {
  const targetFor = sourceTargetFor(context, sourceFile.fileName)
  return references.flatMap(({ specifier, node }) => {
    const location = locationOf(context, sourceFile, node)
    const target = targetFor(specifier)
    if (specifier === 'axios' || specifier.startsWith('axios/')) {
      return isApprovedNetworkBoundary(context, sourceFile.fileName)
        ? []
        : [
            `[fail] API-DATA-003 ${location} imports axios outside ${systemApiPath}/*Api or *Adapters; remote data must flow through the RTK Query API boundary`,
          ]
    }
    if (!target) return []
    if (isJsonUnderSource(target)) {
      return [
        `[fail] API-DATA-002 ${location} imports local JSON ${target}; registry runtime data must come from the API`,
      ]
    }
    // Type-only imports never enter this runtime-reference list. A filename
    // ending in Types/Schemas cannot launder authored runtime values from a
    // local authority folder; only erased contracts may cross that boundary.
    return isLocalAuthority(target)
      ? [
          `[fail] API-DATA-001 ${location} imports runtime local authority ${target}; use the RTK Query API boundary and keep local contracts type-only`,
        ]
      : []
  })
}

const networkCallFindings = (context, typescript, sourceFile) => {
  if (isApprovedNetworkBoundary(context, sourceFile.fileName)) return []
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (isDirectFetchCall(typescript, sourceFile, node)) {
      findings.push(
        `[fail] API-DATA-003 ${locationOf(context, sourceFile, node)} calls fetch outside ${systemApiPath}/*Api or *Adapters; remote data must flow through the RTK Query API boundary`
      )
    }
    if (isUnboundAxiosCall(typescript, sourceFile, node)) {
      findings.push(
        `[fail] API-DATA-003 ${locationOf(context, sourceFile, node)} calls axios outside ${systemApiPath}/*Api or *Adapters; remote data must flow through the RTK Query API boundary`
      )
    }
  })
  return findings
}

const literalText = (typescript, node) => {
  if (
    typescript.isStringLiteral(node) ||
    typescript.isNoSubstitutionTemplateLiteral(node) ||
    typescript.isJsxText(node)
  ) {
    return node.text.trim()
  }
  return null
}

const presentationLiteralFindings = (context, typescript, sourceFile) => {
  const relative = relativeToProject(context, sourceFile.fileName)
  const governedView = productionViewPattern.test(relative)
  const governedSystem = governedPresentationSystemPattern.test(relative)
  if (!governedView && !governedSystem) return []

  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    const value = literalText(typescript, node)
    if (!value) return
    const visibleJsxCopy =
      governedView &&
      /\p{L}/u.test(value) &&
      (typescript.isJsxText(node) ||
        ((typescript.isStringLiteral(node) ||
          typescript.isNoSubstitutionTemplateLiteral(node)) &&
          typescript.isJsxExpression(node.parent)))
    const presentationAttribute =
      governedView &&
      typescript.isStringLiteral(node) &&
      typescript.isJsxAttribute(node.parent) &&
      presentationAttributeNames.has(node.parent.name.getText(sourceFile))
    const authoredIdentity = authoredIdentityPattern.test(value)
    const destination = absoluteDestinationPattern.test(value)
    if (visibleJsxCopy || presentationAttribute || authoredIdentity || destination) {
      findings.push(
        `[fail] API-DATA-006 ${locationOf(context, sourceFile, node)} embeds authored presentation copy or a destination in runtime; serve presentation content through /data and select it from RTK Query`
      )
    }
  })
  return findings
}

const findingsForFile = (context, typescript, filePath) => {
  const relative = relativeToProject(context, filePath)
  if (!relative.startsWith('src/') || testPathPattern.test(relative)) return []
  const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
  const references = runtimeModuleReferences(typescript, sourceFile)
  return [
    ...moduleReferenceFindings(context, sourceFile, references),
    ...networkCallFindings(context, typescript, sourceFile),
    ...presentationLiteralFindings(context, typescript, sourceFile),
  ]
}

const jsonFileFindings = (context) =>
  (context.sourceJsonFiles ?? []).flatMap((filePath) => {
    const relative = relativeToProject(context, filePath)
    return relative.startsWith('src/') && !testPathPattern.test(relative)
      ? [
          `[fail] API-DATA-002 ${relative}:1 stores local JSON under src; registry runtime data must come from the API`,
        ]
      : []
  })

const apiBoundaryFindings = (context) =>
  context.apiFiles.some((filePath) =>
    systemApiPattern.test(relativeToProject(context, filePath))
  )
    ? []
    : [
        `[fail] API-DATA-004 ${systemApiPath}: registry requires an RTK Query createApi root inside the system API boundary`,
      ]

const apiRouteFindings = (context) =>
  context.apiFiles
    .filter((filePath) => context.sourceFiles.includes(filePath))
    .flatMap((filePath) => {
      const source = context.readText(filePath)
      return requiredApiRoutes
        .filter(
          (route) => !source.includes(`'${route}'`) && !source.includes(`"${route}"`)
        )
        .map(
          (route) =>
            `[fail] API-DATA-007 ${context.relativeToProject(filePath)}: required server-data route ${route} must be owned by the RTK Query API boundary`
        )
    })

export const collectApiDataAuthorityFindings = (context) => {
  const typescript = resolveTypescript(context.projectRoot)
  return typescript
    ? [
        ...apiBoundaryFindings(context),
        ...apiRouteFindings(context),
        ...jsonFileFindings(context),
        ...context.sourceFiles.flatMap((filePath) =>
          findingsForFile(context, typescript, filePath)
        ),
      ]
    : ['[fail] API-DATA-005 TypeScript parser is required for API data-authority checks']
}
