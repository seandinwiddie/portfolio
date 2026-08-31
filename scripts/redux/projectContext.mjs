import fs from 'node:fs'
import path from 'node:path'
import { roleForSpecifier } from './roleRules.mjs'
import {
  importedBindingsFor,
  importedCallsFor,
  parseSource,
  resolveTypescript,
} from './typescriptAst.mjs'
const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
])

const walkSourceTree = (root, onFile) => {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      walkSourceTree(filePath, onFile)
    } else if (entry.isFile()) {
      onFile(filePath)
    }
  }
}

const hasSourceExtension = (filePath) =>
  sourceExtensions.has(path.extname(filePath).toLowerCase())

const isTestFile = (filePath) =>
  /(?:^|[\\/])__tests__[\\/]|\.(test|spec|stories)\./.test(filePath)

const isProductionSource = (filePath) =>
  !isTestFile(filePath) && hasSourceExtension(filePath)

const isProductionJson = (filePath) =>
  !isTestFile(filePath) && path.extname(filePath).toLowerCase() === '.json'

/**
 * Creates context for this Expo app's two source trees and one root store.
 * @signature export const createProjectContext = (projectRoot) => object
 */
export const createProjectContext = (projectRoot) => {
  const srcRoot = path.join(projectRoot, 'src')
  const appRoot = path.join(projectRoot, 'app')
  const manifestFile = path.join(projectRoot, 'package.json')
  const toPosix = (filePath) => filePath.split(path.sep).join('/')
  const relativeToProject = (filePath) => toPosix(path.relative(projectRoot, filePath))
  const readText = (filePath) => fs.readFileSync(filePath, 'utf8')
  const lineCount = (text) => (text.length ? text.split(/\r\n|\r|\n/).length : 0)
  const lineNumber = (text, offset) => text.slice(0, offset).split(/\r\n|\r|\n/).length
  const fileContains = (filePath, pattern) => pattern.test(readText(filePath))

  const sourceFiles = []
  const sourceJsonFiles = []
  walkSourceTree(srcRoot, (filePath) => {
    if (isProductionSource(filePath)) sourceFiles.push(filePath)
    if (isProductionJson(filePath)) sourceJsonFiles.push(filePath)
  })
  walkSourceTree(appRoot, (filePath) => {
    if (isProductionSource(filePath)) sourceFiles.push(filePath)
  })
  sourceFiles.sort()
  sourceJsonFiles.sort()

  const sourceFileByResolvedPath = new Map(
    sourceFiles.map((filePath) => [path.resolve(filePath), filePath])
  )
  const typescript = resolveTypescript(projectRoot)
  const filesCallingImport = (modules, importedName) =>
    !typescript
      ? []
      : sourceFiles
          .filter((filePath) => {
            const sourceFile = parseSource(typescript, filePath, readText(filePath))
            const bindings = importedBindingsFor(
              typescript,
              sourceFile,
              modules,
              importedName
            )
            return importedCallsFor(typescript, sourceFile, bindings).length > 0
          })
          .sort()
  const apiFiles = filesCallingImport(
    ['@reduxjs/toolkit/query', '@reduxjs/toolkit/query/react'],
    'createApi'
  )
  const configureStoreFiles = filesCallingImport(['@reduxjs/toolkit'], 'configureStore')
  const storeFiles = sourceFiles
    .filter((filePath) => path.dirname(filePath) === srcRoot)
    .filter((filePath) => path.basename(filePath).toLowerCase().startsWith('store.'))
    .sort()

  const roleForFile = (filePath) => roleForSpecifier(relativeToProject(filePath))
  const resolveRelativeImport = (fromFile, specifier) => {
    if (!specifier.startsWith('.')) return null
    const base = path.resolve(path.dirname(fromFile), specifier)
    const candidates = [
      base,
      ...[...sourceExtensions].map((extension) => `${base}${extension}`),
      ...[...sourceExtensions].map((extension) => path.join(base, `index${extension}`)),
    ]
    return (
      candidates
        .map((candidate) => sourceFileByResolvedPath.get(path.resolve(candidate)))
        .find(Boolean) ?? null
    )
  }

  return {
    projectRoot,
    srcRoot,
    appRoot,
    manifestFile,
    sourceFiles,
    sourceJsonFiles,
    apiFiles,
    storeFiles,
    configureStoreFiles,
    relativeToProject,
    readText,
    lineCount,
    lineNumber,
    fileContains,
    roleForFile,
    resolveRelativeImport,
  }
}
