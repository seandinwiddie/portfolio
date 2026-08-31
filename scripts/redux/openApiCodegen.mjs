import fs from 'node:fs'
import path from 'node:path'
import {
  importedBindingsFor,
  isImportedCall,
  nodeName,
  parseSource,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'
import { skillDirectoryOf } from '../skill-paths.mjs'

const codegenDependency = '@rtk-query/codegen-openapi'
const skill = 'manage-server-data/generate-rtk-query-from-openapi'
const skillRoot = skillDirectoryOf('manage-server-data-generate-rtk-query-from-openapi')
const localReference = `${skillRoot}/references/codegen-overrides.md`
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']
const smell = (guidance) => ({
  level: 'SMELL',
  skill,
  skillFile: `${skillRoot}/SKILL.md`,
  localReference,
  reference: 'https://redux-toolkit.js.org/rtk-query/usage/code-generation',
  guidance: `${guidance} Read ${skill} for the contextual decision process.`,
})
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

const unquote = (value) => value.replace(/^(['"])(.*)\1$/, '$2')
const scriptConfigPaths = (manifestPath, scripts) =>
  Object.values(scripts ?? {})
    .filter(
      (command) =>
        typeof command === 'string' &&
        (command.includes(codegenDependency) ||
          command.includes('rtk-query-codegen-openapi'))
    )
    .flatMap((command) => {
      const marker = command.match(
        /(?:@rtk-query\/codegen-openapi|rtk-query-codegen-openapi)\s+([^\s;&|]+)/
      )
      return marker ? [path.resolve(path.dirname(manifestPath), unquote(marker[1]))] : []
    })

const discover = (context) => {
  const manifest = readJson(context.manifestFile) ?? {}
  const declared = [
    manifest.dependencies,
    manifest.devDependencies,
    manifest.peerDependencies,
    manifest.optionalDependencies,
  ].some((dependencies) => dependencies && codegenDependency in dependencies)
  const scriptsUseCodegen = Object.values(manifest.scripts ?? {}).some(
    (command) =>
      typeof command === 'string' &&
      (command.includes(codegenDependency) ||
        command.includes('rtk-query-codegen-openapi'))
  )
  const scriptPaths = scriptConfigPaths(context.manifestFile, manifest.scripts)
  const sourceCandidates = fs
    .readdirSync(context.projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(context.projectRoot, entry.name))
    .filter((filePath) => extensions.includes(path.extname(filePath).toLowerCase()))
    .filter((filePath) => {
      const text = fs.readFileSync(filePath, 'utf8')
      return (
        new RegExp(
          `(?:from\\s*|require\\(\\s*)['"]${codegenDependency.replace('/', '\\/')}['"]`
        ).test(text) ||
        (/openapi.*(?:config|codegen)|codegen.*openapi/i.test(path.basename(filePath)) &&
          /\bexport\s+default\b/.test(text) &&
          /\bapiFile\b/.test(text))
      )
    })
  return {
    active: declared || scriptsUseCodegen || sourceCandidates.length > 0,
    configFiles: [...new Set([...scriptPaths, ...sourceCandidates])].sort(),
  }
}

const unwrap = (typescript, expression) => {
  let node = expression
  while (
    node &&
    (typescript.isParenthesizedExpression(node) ||
      typescript.isAsExpression(node) ||
      typescript.isTypeAssertionExpression(node) ||
      (typescript.isSatisfiesExpression?.(node) ?? false))
  )
    node = node.expression
  return node
}

const bindingsFor = (typescript, sourceFile) =>
  new Map(
    sourceFile.statements
      .filter(typescript.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations)
      .filter(
        (declaration) =>
          typescript.isIdentifier(declaration.name) && declaration.initializer
      )
      .map((declaration) => [declaration.name.text, declaration.initializer])
  )

const resolveExpression = (typescript, expression, bindings, seen = new Set()) => {
  const node = unwrap(typescript, expression)
  if (!node || !typescript.isIdentifier(node) || seen.has(node.text)) return node
  const initializer = bindings.get(node.text)
  return initializer
    ? resolveExpression(typescript, initializer, bindings, new Set([...seen, node.text]))
    : node
}

const propertyValue = (typescript, object, sourceFile, name, bindings) => {
  const property = object.properties.find(
    (candidate) => nodeName(typescript, candidate.name, sourceFile) === name
  )
  if (!property) return null
  if (typescript.isPropertyAssignment(property))
    return resolveExpression(typescript, property.initializer, bindings)
  if (typescript.isShorthandPropertyAssignment(property))
    return resolveExpression(typescript, property.name, bindings)
  return null
}

const literalText = (typescript, node) =>
  node &&
  (typescript.isStringLiteralLike(node) ||
    typescript.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null

const hasDynamicProperties = (typescript, object) =>
  object.properties.some(
    (property) =>
      typescript.isSpreadAssignment(property) ||
      typescript.isComputedPropertyName(property.name)
  )

const configObjects = (typescript, sourceFile, bindings) =>
  sourceFile.statements
    .filter(
      (statement) => typescript.isExportAssignment(statement) && !statement.isExportEquals
    )
    .flatMap((statement) => {
      const exported = resolveExpression(typescript, statement.expression, bindings)
      if (!typescript.isObjectLiteralExpression(exported)) return []
      const names = new Set(
        exported.properties.map((property) =>
          nodeName(typescript, property.name, sourceFile)
        )
      )
      if (
        ['apiFile', 'outputFile', 'outputFiles', 'schemaFile'].some((name) =>
          names.has(name)
        )
      ) {
        return [exported]
      }
      return exported.properties
        .filter(typescript.isPropertyAssignment)
        .map((property) => resolveExpression(typescript, property.initializer, bindings))
        .filter(typescript.isObjectLiteralExpression)
    })

const resolveEndpointFile = (context, fromFile, specifier) => {
  const base = path.isAbsolute(specifier)
    ? specifier
    : path.resolve(path.dirname(fromFile), specifier)
  return (
    [base, ...extensions.map((extension) => `${base}${extension}`)]
      .filter((candidate) => {
        const relative = path.relative(context.srcRoot, candidate)
        return (
          relative !== '..' &&
          !relative.startsWith(`..${path.sep}`) &&
          !path.isAbsolute(relative)
        )
      })
      .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ??
    null
  )
}

const createApiBindings = (typescript, sourceFile) =>
  importedBindingsFor(
    typescript,
    sourceFile,
    ['@reduxjs/toolkit/query', '@reduxjs/toolkit/query/react'],
    'createApi'
  )

const emptyRootStatus = (typescript, filePath, apiImport) => {
  const sourceFile = parseSource(typescript, filePath, fs.readFileSync(filePath, 'utf8'))
  const bindings = bindingsFor(typescript, sourceFile)
  const initializer = resolveExpression(typescript, bindings.get(apiImport), bindings)
  if (
    !isImportedCall(typescript, initializer, createApiBindings(typescript, sourceFile))
  ) {
    return 'unknown'
  }
  const config = resolveExpression(typescript, initializer.arguments[0], bindings)
  if (
    !config ||
    !typescript.isObjectLiteralExpression(config) ||
    hasDynamicProperties(typescript, config)
  ) {
    return 'unknown'
  }
  const endpoints = propertyValue(typescript, config, sourceFile, 'endpoints', bindings)
  if (
    !endpoints ||
    (!typescript.isArrowFunction(endpoints) &&
      !typescript.isFunctionExpression(endpoints))
  ) {
    return 'nonempty'
  }
  const body = unwrap(typescript, endpoints.body)
  const returned = typescript.isBlock(body)
    ? body.statements.find(typescript.isReturnStatement)?.expression
    : body
  const value = unwrap(typescript, returned)
  return typescript.isObjectLiteralExpression(value)
    ? value.properties.length === 0
      ? 'empty'
      : 'nonempty'
    : 'unknown'
}

const outputCreatesRoot = (typescript, filePath) => {
  const sourceFile = parseSource(typescript, filePath, fs.readFileSync(filePath, 'utf8'))
  const bindings = createApiBindings(typescript, sourceFile)
  let found = false
  walkNodes(typescript, sourceFile, (node) => {
    if (isImportedCall(typescript, node, bindings)) found = true
  })
  return found
}

const hasSetting = (typescript, object, sourceFile, name, bindings) => {
  const value = propertyValue(typescript, object, sourceFile, name, bindings)
  return Boolean(
    value && (!typescript.isArrayLiteralExpression(value) || value.elements.length > 0)
  )
}

const analyzeConfig = (context, typescript, filePath, sourceFile, object, bindings) => {
  const relative = context.relativeToProject(filePath)
  if (hasDynamicProperties(typescript, object)) {
    return {
      findings: [],
      smells: [smell(`${relative}: codegen config is dynamic or unresolvable.`)],
    }
  }
  const apiFile = literalText(
    typescript,
    propertyValue(typescript, object, sourceFile, 'apiFile', bindings)
  )
  const apiImport = literalText(
    typescript,
    propertyValue(typescript, object, sourceFile, 'apiImport', bindings)
  )
  const outputFile = literalText(
    typescript,
    propertyValue(typescript, object, sourceFile, 'outputFile', bindings)
  )
  const outputsObject = propertyValue(
    typescript,
    object,
    sourceFile,
    'outputFiles',
    bindings
  )
  const outputs = outputFile ? [{ target: outputFile, options: object }] : []
  if (outputsObject && typescript.isObjectLiteralExpression(outputsObject)) {
    outputs.push(
      ...outputsObject.properties
        .filter(typescript.isPropertyAssignment)
        .map((property) => ({
          target: nodeName(typescript, property.name, sourceFile),
          options: resolveExpression(typescript, property.initializer, bindings),
        }))
        .filter(({ options }) => typescript.isObjectLiteralExpression(options))
    )
  }
  const unresolved = !apiFile || !apiImport || outputs.length === 0
  const findings = []
  const smells = unresolved
    ? [smell(`${relative}: codegen config is dynamic or unresolvable.`)]
    : []
  const resolvedApi = apiFile ? resolveEndpointFile(context, filePath, apiFile) : null
  if (apiFile && !resolvedApi) {
    findings.push(
      `${relative}: apiFile ${apiFile} does not resolve to a shared empty createApi root`
    )
  } else if (resolvedApi && apiImport) {
    const status = emptyRootStatus(typescript, resolvedApi, apiImport)
    if (status === 'nonempty') {
      findings.push(
        `${context.relativeToProject(resolvedApi)}: apiFile export ${apiImport} must be a shared createApi root with an empty endpoints factory`
      )
    } else if (status === 'unknown') {
      smells.push(
        smell(`${relative}: apiFile export ${apiImport} cannot be resolved statically.`)
      )
    }
  }
  outputs.forEach(({ target, options }) => {
    const resolvedOutput = resolveEndpointFile(context, filePath, target)
    if (resolvedOutput && outputCreatesRoot(typescript, resolvedOutput)) {
      findings.push(
        `${context.relativeToProject(resolvedOutput)}: generated output creates a new createApi root instead of injecting endpoints`
      )
    } else if (!resolvedOutput) {
      smells.push(
        smell(
          `${relative}: generated output ${target} is not available for static review.`
        )
      )
    }
    if (
      !hasSetting(typescript, options, sourceFile, 'filterEndpoints', bindings) &&
      !hasSetting(typescript, object, sourceFile, 'filterEndpoints', bindings)
    ) {
      smells.push(
        smell(
          `${relative}: broad generation has no filterEndpoints setting for ${target}.`
        )
      )
    }
    if (
      !hasSetting(typescript, options, sourceFile, 'endpointOverrides', bindings) &&
      !hasSetting(typescript, object, sourceFile, 'endpointOverrides', bindings)
    ) {
      smells.push(smell(`${relative}: endpointOverrides are absent for ${target}.`))
    }
  })
  return { findings, smells }
}

const inspect = (context) => {
  const discovery = discover(context)
  if (!discovery.active) return { findings: [], smells: [] }
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript || discovery.configFiles.length === 0) {
    return {
      findings: [],
      smells: [
        smell(
          'OpenAPI codegen is declared or used, but its config is not statically resolvable.'
        ),
      ],
    }
  }
  const analyses = discovery.configFiles.flatMap((filePath) => {
    if (!fs.existsSync(filePath)) {
      return [
        {
          findings: [],
          smells: [
            smell(
              `${context.relativeToProject(filePath)}: codegen config is unavailable.`
            ),
          ],
        },
      ]
    }
    const sourceFile = parseSource(
      typescript,
      filePath,
      fs.readFileSync(filePath, 'utf8')
    )
    const bindings = bindingsFor(typescript, sourceFile)
    const objects = configObjects(typescript, sourceFile, bindings)
    return objects.length
      ? objects.map((object) =>
          analyzeConfig(context, typescript, filePath, sourceFile, object, bindings)
        )
      : [
          {
            findings: [],
            smells: [
              smell(
                `${context.relativeToProject(filePath)}: codegen config is dynamic or unresolvable.`
              ),
            ],
          },
        ]
  })
  return {
    findings: [...new Set(analyses.flatMap(({ findings }) => findings))],
    smells: [
      ...new Map(
        analyses
          .flatMap(({ smells }) => smells)
          .map((notice) => [notice.guidance, notice])
      ).values(),
    ],
  }
}

/**
 * Collects only statically proven RTK Query OpenAPI codegen violations.
 * User Story: As an app maintainer, I need generated endpoints to extend one shared empty API root.
 * @signature export const collectOpenApiCodegenFindings = (context) => string[]
 */
export const collectOpenApiCodegenFindings = (context) => inspect(context).findings

/**
 * Collects contextual OpenAPI generation review notices without failing conformance.
 * User Story: As an app maintainer, I need unresolved and broad generation choices routed to the codegen skill.
 * @signature export const collectOpenApiCodegenSmells = (context) => object[]
 */
export const collectOpenApiCodegenSmells = (context) => inspect(context).smells
