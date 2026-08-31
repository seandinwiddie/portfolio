import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { skillFileOf } from '../skill-paths.mjs'

export const CORE_PACKAGE = 'functional-programming-composition'
export const FP_SKILL = skillFileOf('fp')

const own = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key)

export const blocking = (code, message, lines) => ({
  code,
  severity: 'BLOCKING',
  message,
  skillReference: `${FP_SKILL}:${lines}`,
  advice: `Read the FP skill guidance at ${FP_SKILL}:${lines}.`,
})

export const engineering = (code, message) => ({
  code,
  severity: 'BLOCKING',
  message,
  engineeringReference: 'Package engineering: dual-target declaration/runtime parity',
  advice:
    'Review the package exports map, declaration targets, and ESM/CJS runtime surfaces together.',
})

export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

export const inspectProjectDependency = (manifest) => {
  const declared = manifest.dependencies
  const version =
    declared !== null && typeof declared === 'object' ? declared[CORE_PACKAGE] : undefined

  return manifest.name === CORE_PACKAGE ||
    (typeof version === 'string' && version.trim().length > 0)
    ? []
    : [
        blocking(
          'FP-CORE-001',
          `${CORE_PACKAGE} must be declared in the package.json dependencies object; mentions elsewhere in the manifest do not establish a runtime dependency.`,
          '64-65'
        ),
      ]
}

const ascendToPackage = async (directory) => {
  const manifestPath = join(directory, 'package.json')
  const result = await readFile(manifestPath, 'utf8').then(
    (text) => ({ _tag: 'Found', manifest: JSON.parse(text) }),
    () => ({ _tag: 'Missing' })
  )
  const parent = dirname(directory)
  const matches = result._tag === 'Found' && result.manifest.name === CORE_PACKAGE

  return matches
    ? { packageDirectory: directory, manifest: result.manifest }
    : parent === directory
      ? Promise.reject(new Error(`Could not locate ${CORE_PACKAGE}'s package.json.`))
      : ascendToPackage(parent)
}

export const resolveInstalledCore = async (projectRoot) => {
  const projectManifest = resolve(projectRoot, 'package.json')
  const requireFromProject = createRequire(pathToFileURL(projectManifest))
  const manifest = await readJson(projectManifest)
  const installed =
    manifest.name === CORE_PACKAGE
      ? { packageDirectory: resolve(projectRoot), manifest }
      : await Promise.resolve()
          .then(() => requireFromProject.resolve(CORE_PACKAGE))
          .then((entry) => ascendToPackage(dirname(entry)))

  return { ...installed, requireFromProject }
}

const rootExport = (manifest) =>
  typeof manifest.exports === 'string'
    ? manifest.exports
    : (manifest.exports?.['.'] ?? manifest.exports)

const atPath = (value, keys) =>
  keys.reduce(
    (current, key) =>
      current !== null && typeof current === 'object' ? current[key] : undefined,
    value
  )

const firstString = (values) => values.find((value) => typeof value === 'string')

export const packageTargets = (manifest) => {
  const exported = rootExport(manifest)
  const esmTypes = firstString([
    atPath(exported, ['import', 'types']),
    atPath(exported, ['types']),
    manifest.types,
  ])
  const cjsTypes = firstString([
    atPath(exported, ['require', 'types']),
    atPath(exported, ['types']),
    manifest.types,
  ])
  const esm = firstString([
    atPath(exported, ['import', 'default']),
    atPath(exported, ['import']),
    atPath(exported, ['default']),
    typeof exported === 'string' ? exported : undefined,
    manifest.module,
    manifest.main,
  ])
  const cjs = firstString([
    atPath(exported, ['require', 'default']),
    atPath(exported, ['require']),
    atPath(exported, ['default']),
    typeof exported === 'string' ? exported : undefined,
    manifest.main,
  ])

  return { esmTypes, cjsTypes, esm, cjs }
}

const bindingNames = (name) =>
  ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap((element) =>
        ts.isOmittedExpression(element) ? [] : bindingNames(element.name)
      )

const exported = (statement) =>
  statement.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
  ) ?? false

const defaulted = (statement) =>
  statement.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
  ) ?? false

const declarationNames = (statement) => {
  const namedDeclaration =
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isEnumDeclaration(statement)
  const variableNames = ts.isVariableStatement(statement)
    ? statement.declarationList.declarations.flatMap((declaration) =>
        bindingNames(declaration.name)
      )
    : []
  const directNames =
    namedDeclaration && statement.name ? [statement.name.text] : variableNames

  return exported(statement) ? (defaulted(statement) ? ['default'] : directNames) : []
}

const exportDeclarationNames = (statement) =>
  ts.isExportDeclaration(statement) &&
  !statement.isTypeOnly &&
  statement.exportClause &&
  ts.isNamedExports(statement.exportClause)
    ? statement.exportClause.elements.flatMap((element) =>
        element.isTypeOnly ? [] : [element.name.text]
      )
    : ts.isExportAssignment(statement)
      ? ['default']
      : []

export const declaredValueExports = async (declarationPath) => {
  const source = await readFile(declarationPath, 'utf8')
  const syntax = ts.createSourceFile(
    declarationPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  return [
    ...new Set(
      syntax.statements.flatMap((statement) => [
        ...declarationNames(statement),
        ...exportDeclarationNames(statement),
      ])
    ),
  ].sort()
}

const runtimeKeys = (runtime) =>
  Object.keys(runtime)
    .filter((key) => key !== '__esModule')
    .sort()

export const loadCoreSurfaces = async (installed) => {
  const targets = packageTargets(installed.manifest)
  const paths = Object.fromEntries(
    Object.entries(targets).map(([key, target]) => [
      key,
      typeof target === 'string'
        ? resolve(installed.packageDirectory, target)
        : undefined,
    ])
  )
  const required = ['esmTypes', 'cjsTypes', 'esm', 'cjs']
  const missing = required.filter((key) => !paths[key])

  return missing.length > 0
    ? Promise.reject(new Error(`Package targets are missing: ${missing.join(', ')}.`))
    : Promise.all([
        declaredValueExports(paths.esmTypes),
        declaredValueExports(paths.cjsTypes),
        import(`${pathToFileURL(paths.esm).href}?fp-contract`),
        Promise.resolve().then(() => installed.requireFromProject(paths.cjs)),
      ]).then(([esmDeclared, cjsDeclared, esmRuntime, cjsRuntime]) => ({
        packageDirectory: installed.packageDirectory,
        paths,
        esm: { declared: esmDeclared, runtime: runtimeKeys(esmRuntime) },
        cjs: { declared: cjsDeclared, runtime: runtimeKeys(cjsRuntime) },
        runtimes: { esm: esmRuntime, cjs: cjsRuntime },
      }))
}

export const dependencyFieldFindings = (manifest) =>
  ['dependencies', 'peerDependencies', 'optionalDependencies'].flatMap((field) => {
    const value = manifest[field]
    const names = value !== null && typeof value === 'object' ? Object.keys(value) : []
    const invalid = value !== undefined && (value === null || typeof value !== 'object')

    return names.length > 0 || invalid
      ? [
          blocking(
            'FP-CORE-005',
            `${CORE_PACKAGE} must have zero ${field}; found ${invalid ? 'an invalid field' : names.join(', ')}.`,
            '64-65'
          ),
        ]
      : []
  })

export const compareSurface = (surface, mode) => {
  const declared = new Set(surface.declared)
  const runtime = new Set(surface.runtime)
  const missing = surface.declared.filter((name) => !runtime.has(name))
  const extra = surface.runtime.filter((name) => !declared.has(name))

  return missing.length === 0 && extra.length === 0
    ? []
    : [
        engineering(
          mode === 'ESM' ? 'FP-CORE-003' : 'FP-CORE-004',
          `${mode} runtime exports differ from declared value exports (missing: ${missing.join(', ') || 'none'}; undeclared: ${extra.join(', ') || 'none'}).`
        ),
      ]
}

export const hasOwn = own
