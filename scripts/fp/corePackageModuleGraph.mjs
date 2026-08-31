import { readFile, realpath } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { parseSource, resolveTypescript, walkNodes } from './astShared.mjs'
import { bindingScopes, isLexicallyBound } from './corePackageLexicalBindings.mjs'

const moduleSpecifier = (ts, node) =>
  ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
    ? node.moduleSpecifier
    : null

const memberName = (ts, node) => {
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  const argument = ts.isElementAccessExpression(node) ? node.argumentExpression : null
  return argument && ts.isStringLiteralLike(argument) ? argument.text : null
}

const callSpecifier = (ts, node, bindings) => {
  if (!ts.isCallExpression(node) || node.arguments.length !== 1) return null
  const required =
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'require' &&
    !isLexicallyBound(bindings, node.expression, 'require')
  const member =
    ts.isPropertyAccessExpression(node.expression) ||
    ts.isElementAccessExpression(node.expression)
  const owner = member ? node.expression.expression : null
  const moduleRequired =
    member &&
    memberName(ts, node.expression) === 'require' &&
    ts.isIdentifier(owner) &&
    owner.text === 'module' &&
    !isLexicallyBound(bindings, owner, 'module')
  const imported = node.expression.kind === ts.SyntaxKind.ImportKeyword
  return required || moduleRequired || imported ? node.arguments[0] : null
}

const specifiersIn = (ts, sourceFile) => {
  const found = []
  const bindings = bindingScopes(ts, sourceFile)
  walkNodes(ts, sourceFile, (node) => {
    const specifier = moduleSpecifier(ts, node) ?? callSpecifier(ts, node, bindings)
    if (specifier && ts.isStringLiteralLike(specifier)) {
      found.push({ specifier: specifier.text, node: specifier })
    }
  })
  return found
}

const inside = (root, target) => {
  const path = relative(root, target)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}

const candidatePaths = (from, specifier, mode) => {
  const clean = specifier.replace(/[?#].*$/, '')
  const base = resolve(dirname(from), clean)
  if (extname(base)) return [base]
  const extensions = mode === 'CJS' ? ['.cjs', '.js', '.mjs'] : ['.js', '.mjs', '.cjs']
  return [
    base,
    ...extensions.map((extension) => `${base}${extension}`),
    ...extensions.map((extension) => join(base, `index${extension}`)),
  ]
}

const readCandidate = async (candidates) => {
  for (const candidate of candidates) {
    const result = await readFile(candidate, 'utf8').then(
      (text) => ({ _tag: 'Found', path: candidate, text }),
      () => ({ _tag: 'Missing' })
    )
    if (result._tag === 'Found') return result
  }
  return { _tag: 'Missing' }
}

const locationOf = (sourceFile, node) => {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return { line: location.line + 1, column: location.character + 1 }
}

const resolveRelative = async (root, edge) => {
  const lexical = candidatePaths(edge.from, edge.specifier, edge.mode)
  if (!inside(root, lexical[0])) return { _tag: 'Outside', path: lexical[0] }
  const found = await readCandidate(lexical)
  if (found._tag === 'Missing') return found
  const actual = await realpath(found.path).catch(() => found.path)
  return inside(root, actual)
    ? { ...found, path: actual }
    : { _tag: 'Outside', path: actual }
}

const graphIssue = (kind, edge, target) => ({
  kind,
  from: edge.from,
  mode: edge.mode,
  specifier: edge.specifier,
  target,
  line: edge.line,
  column: edge.column,
})

export const loadCoreModuleGraph = async (paths, packageDirectory, projectRoot) => {
  const ts = resolveTypescript(projectRoot)
  if (!ts)
    throw new Error('TypeScript parser is required for FP core module graph checks')
  const root = await realpath(packageDirectory).catch(() => resolve(packageDirectory))
  const queue = [
    { path: resolve(paths.esm), mode: 'ESM' },
    { path: resolve(paths.cjs), mode: 'CJS' },
  ]
  const seen = new Set()
  const modules = []
  const externals = []
  const issues = []
  while (queue.length) {
    const current = queue.shift()
    const actualPath = await realpath(current.path).catch(() => current.path)
    if (!inside(root, actualPath)) {
      issues.push(
        graphIssue(
          'outside-package',
          {
            from: current.path,
            mode: current.mode,
            specifier: current.path,
            line: 1,
            column: 1,
          },
          actualPath
        )
      )
      continue
    }
    const key = `${current.mode}:${actualPath}`
    if (seen.has(key)) continue
    seen.add(key)
    const loaded =
      current.text === undefined
        ? await readFile(actualPath, 'utf8').then(
            (text) => ({ _tag: 'Found', text }),
            () => ({ _tag: 'Missing' })
          )
        : { _tag: 'Found', text: current.text }
    if (loaded._tag === 'Missing') {
      issues.push(
        graphIssue(
          'unreadable-module',
          {
            from: current.path,
            mode: current.mode,
            specifier: current.path,
            line: 1,
            column: 1,
          },
          current.path
        )
      )
      continue
    }
    const sourceFile = parseSource(ts, actualPath, loaded.text)
    const module = { ...current, path: actualPath, text: loaded.text, sourceFile }
    modules.push(module)
    const edges = specifiersIn(ts, sourceFile).map(({ specifier, node }) => ({
      from: actualPath,
      mode: current.mode,
      specifier,
      ...locationOf(sourceFile, node),
    }))
    for (const edge of edges) {
      if (!edge.specifier.startsWith('.')) {
        externals.push(edge)
        continue
      }
      const local = await resolveRelative(root, edge)
      if (local._tag === 'Found') {
        queue.push({ path: local.path, mode: current.mode, text: local.text })
      } else {
        issues.push(
          graphIssue(
            local._tag === 'Outside' ? 'outside-package' : 'unresolved-relative',
            edge,
            local.path
          )
        )
      }
    }
  }
  return { packageDirectory: root, modules, externals, issues }
}
