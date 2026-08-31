import {
  importedBindingsFor,
  isImportedCall,
  parseSource,
  resolveTypescript,
} from './typescriptAst.mjs'
import { skillFileOf } from '../skill-paths.mjs'

const collectionMethods = new Set(['map', 'filter', 'reduce', 'flatMap'])
const skill = 'model-redux-state/build-slices-and-selectors'
const skillFile = skillFileOf('model-redux-state-build-slices-and-selectors')
const reference = 'https://redux-toolkit.js.org/api/createSelector'

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

const functionName = (typescript, node) => {
  if (node.name && typescript.isIdentifier(node.name)) return node.name.text
  const parent = node.parent
  if (typescript.isVariableDeclaration(parent) && typescript.isIdentifier(parent.name)) {
    return parent.name.text
  }
  if (typescript.isPropertyAssignment(parent) && parent.name) return parent.name.getText()
  return ''
}

const returnedExpressions = (typescript, fn) => {
  const body = unwrap(typescript, fn.body)
  if (!typescript.isBlock(body)) return body ? [body] : []
  const expressions = []
  const visit = (node) => {
    if (
      node !== body &&
      (typescript.isArrowFunction(node) ||
        typescript.isFunctionExpression(node) ||
        typescript.isFunctionDeclaration(node))
    )
      return
    if (typescript.isReturnStatement(node) && node.expression)
      expressions.push(node.expression)
    typescript.forEachChild(node, visit)
  }
  visit(body)
  return expressions
}

const localBindings = (typescript, fn) => {
  const bindings = new Map()
  const visit = (node) => {
    if (
      node !== fn &&
      (typescript.isArrowFunction(node) ||
        typescript.isFunctionExpression(node) ||
        typescript.isFunctionDeclaration(node))
    )
      return
    if (
      typescript.isVariableDeclaration(node) &&
      typescript.isIdentifier(node.name) &&
      node.initializer
    )
      bindings.set(node.name.text, node.initializer)
    typescript.forEachChild(node, visit)
  }
  visit(fn)
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

const dependsOn = (typescript, node, parameter, bindings, seen = new Set()) => {
  const value = unwrap(typescript, node)
  if (!value || seen.has(value)) return false
  if (typescript.isIdentifier(value)) {
    if (value.text === parameter) return true
    const initializer = bindings.get(value.text)
    return initializer
      ? dependsOn(typescript, initializer, parameter, bindings, new Set([...seen, value]))
      : false
  }
  if (
    typescript.isPropertyAccessExpression(value) ||
    typescript.isElementAccessExpression(value)
  ) {
    return dependsOn(typescript, value.expression, parameter, bindings, seen)
  }
  if (
    typescript.isCallExpression(value) &&
    typescript.isPropertyAccessExpression(value.expression)
  ) {
    return dependsOn(typescript, value.expression.expression, parameter, bindings, seen)
  }
  return false
}

const collectionCallsFor = (typescript, expression, bindings) => {
  const calls = []
  const seenIdentifiers = new Set()
  const visit = (node) => {
    const value = unwrap(typescript, node)
    if (!value) return
    if (typescript.isIdentifier(value) && bindings.has(value.text)) {
      if (seenIdentifiers.has(value.text)) return
      seenIdentifiers.add(value.text)
      visit(bindings.get(value.text))
      return
    }
    if (
      typescript.isCallExpression(value) &&
      typescript.isPropertyAccessExpression(value.expression) &&
      collectionMethods.has(value.expression.name.text)
    )
      calls.push(value)
    typescript.forEachChild(value, (child) => {
      if (
        typescript.isArrowFunction(child) ||
        typescript.isFunctionExpression(child) ||
        typescript.isFunctionDeclaration(child)
      )
        return
      visit(child)
    })
  }
  visit(resolveLocal(typescript, expression, bindings))
  return calls
}

const insideCreateSelector = (typescript, node, bindings) => {
  let current = node.parent
  while (current && !typescript.isVariableDeclaration(current)) {
    if (isImportedCall(typescript, current, bindings)) return true
    current = current.parent
  }
  return false
}

const stateParameterStatus = (typescript, parameter, sourceFile) => {
  if (!parameter || !typescript.isIdentifier(parameter.name)) return 'none'
  const name = parameter.name.text
  const type = parameter.type?.getText(sourceFile) ?? ''
  return /^(?:_?state|rootState|appState)$/i.test(name) ||
    /(?:Root|App)State\b|RootShape\b/.test(type)
    ? 'proven'
    : 'possible'
}

const reviewFor = (unit, sourceFile, node) => ({
  level: 'REVIEW',
  skill,
  skillFile,
  reference,
  guidance: `${unit.rel}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: selector collection derivation has an unproven state input; review whether createSelector is required for stable references.`,
})

export const analyzeSelectorMemoization = (context, unit) => {
  if (unit.role !== 'selectors') return { findings: [], reviews: [] }
  const typescript = resolveTypescript(context.projectRoot ?? process.cwd())
  if (!typescript) return { findings: [], reviews: [] }
  const sourceFile = parseSource(typescript, unit.filePath, unit.text)
  const createSelectorBindings = importedBindingsFor(
    typescript,
    sourceFile,
    ['@reduxjs/toolkit'],
    'createSelector'
  )
  const findings = []
  const reviews = []
  const visit = (node) => {
    const isFunction =
      typescript.isArrowFunction(node) ||
      typescript.isFunctionExpression(node) ||
      typescript.isFunctionDeclaration(node) ||
      typescript.isMethodDeclaration(node)
    if (
      !isFunction ||
      !node.body ||
      insideCreateSelector(typescript, node, createSelectorBindings)
    ) {
      typescript.forEachChild(node, visit)
      return
    }
    const parameter = node.parameters[0]
    if (!parameter || !typescript.isIdentifier(parameter.name)) {
      typescript.forEachChild(node, visit)
      return
    }
    const bindings = localBindings(typescript, node)
    const calls = returnedExpressions(typescript, node)
      .flatMap((expression) => collectionCallsFor(typescript, expression, bindings))
      .filter((call) =>
        dependsOn(typescript, call.expression.expression, parameter.name.text, bindings)
      )
    if (calls.length) {
      const status = stateParameterStatus(typescript, parameter, sourceFile)
      const namedSelector = /^select[A-Z0-9_$]/.test(functionName(typescript, node))
      if (status === 'proven' && namedSelector) {
        calls.forEach((call) =>
          findings.push(
            `${unit.rel}:${sourceFile.getLineAndCharacterOfPosition(call.getStart(sourceFile)).line + 1}: state selector derives a collection without createSelector; memoize derived view shapes with createSelector for stable references (build-slices-and-selectors, debug-redux-toolkit-apps)`
          )
        )
      } else if (namedSelector) {
        reviews.push(...calls.map((call) => reviewFor(unit, sourceFile, call)))
      }
    }
    typescript.forEachChild(node, visit)
  }
  visit(sourceFile)
  return {
    findings: [...new Set(findings)],
    reviews: [...new Map(reviews.map((review) => [review.guidance, review])).values()],
  }
}

export const collectSelectorMemoizationReviews = (context) =>
  context.sourceFiles
    .filter((filePath) => context.roleForFile(filePath) === 'selectors')
    .flatMap(
      (filePath) =>
        analyzeSelectorMemoization(context, {
          role: 'selectors',
          rel: context.relativeToProject(filePath),
          filePath,
          text: context.readText(filePath),
        }).reviews
    )
