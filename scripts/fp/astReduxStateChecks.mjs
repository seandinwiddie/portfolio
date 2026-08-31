import { FP_AST_RULES } from './astRules.mjs'
import { findingFor, unwrapExpression, walkNodes } from './astShared.mjs'
import {
  importedTypeAt,
  reduxBindingsFor,
  reduxFactoryAt,
  wrapperTypeAt,
  wrapperValueAt,
} from './astReduxBindings.mjs'
import { reduxStoredValues } from './astReduxMutationChecks.mjs'
const wrapperTags = new Set([
  'Just',
  'Nothing',
  'Left',
  'Right',
  'Success',
  'Failure',
  'Some',
  'None',
])
const transparentReduxStateTypes = new Set(['Draft', 'WritableDraft'])
const declarationsFor = (ts, sourceFile) => {
  const variables = new Map()
  const types = new Map()
  walkNodes(ts, sourceFile, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      variables.set(node.name.text, node)
    }
    if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name
    ) {
      types.set(node.name.text, node)
    }
  })
  return { variables, types }
}
const resolveValue = (ts, node, declarations, resolving = new Set()) => {
  const value = unwrapExpression(ts, node)
  if (!value || !ts.isIdentifier(value) || resolving.has(value.text)) return value
  const declaration = declarations.variables.get(value.text)
  return declaration?.initializer
    ? resolveValue(
        ts,
        declaration.initializer,
        declarations,
        new Set(resolving).add(value.text)
      )
    : value
}
const propertyNamed = (ts, object, sourceFile, name) =>
  object && ts.isObjectLiteralExpression(object)
    ? object.properties.find(
        (property) =>
          property.name?.getText(sourceFile).replace(/^['"]|['"]$/g, '') === name
      )
    : null
const propertyValue = (ts, property) => {
  if (!property) return null
  if (ts.isPropertyAssignment(property)) return property.initializer
  if (ts.isShorthandPropertyAssignment(property)) return property.name
  if (ts.isMethodDeclaration(property)) return property
  return null
}
const returnedValues = (ts, fn) => {
  if (!fn.body) return []
  if (!ts.isBlock(fn.body)) return [fn.body]
  const values = []
  const visit = (node) => {
    if (node !== fn.body && ts.isFunctionLike(node)) return
    if (ts.isReturnStatement(node) && node.expression) values.push(node.expression)
    else ts.forEachChild(node, visit)
  }
  visit(fn.body)
  return values
}
const storedWrappers = (file, ts, sourceFile, root, context, resolving = new Set()) => {
  const { bindings, declarations } = context
  const value = unwrapExpression(ts, root)
  if (!value) return []
  const wrapper = ts.isCallExpression(value)
    ? wrapperValueAt(ts, value.expression, bindings)
    : wrapperValueAt(ts, value, bindings)
  if (wrapper)
    return [
      findingFor(
        FP_AST_RULES.serializableState,
        file,
        sourceFile,
        value,
        `rich FP wrapper ${ts.isCallExpression(value) ? 'constructor' : 'value'} ${wrapper} is stored in ${context.label}`
      ),
    ]
  if (ts.isCallExpression(value))
    return [
      findingFor(
        FP_AST_RULES.unresolvedStateTypeReview,
        file,
        sourceFile,
        value,
        `opaque call result is stored in ${context.label} and requires state-shape review`
      ),
    ]
  if (ts.isIdentifier(value) && !resolving.has(value.text)) {
    const declaration = declarations.variables.get(value.text)
    return declaration?.initializer
      ? storedWrappers(
          file,
          ts,
          sourceFile,
          declaration.initializer,
          context,
          new Set(resolving).add(value.text)
        )
      : []
  }
  if (ts.isFunctionLike(value)) {
    return returnedValues(ts, value).flatMap((item) =>
      storedWrappers(file, ts, sourceFile, item, context, resolving)
    )
  }
  if (ts.isObjectLiteralExpression(value)) {
    const tagProperty = propertyNamed(ts, value, sourceFile, '_tag')
    const tag = unwrapExpression(ts, propertyValue(ts, tagProperty))
    const literal =
      tag && ts.isStringLiteral(tag) && wrapperTags.has(tag.text)
        ? [
            findingFor(
              FP_AST_RULES.serializableState,
              file,
              sourceFile,
              value,
              `literal tagged FP wrapper ${tag.text} is stored in ${context.label}`
            ),
          ]
        : []
    return [
      ...literal,
      ...value.properties.flatMap((property) => {
        const item = ts.isSpreadAssignment(property)
          ? property.expression
          : propertyValue(ts, property)
        return item ? storedWrappers(file, ts, sourceFile, item, context, resolving) : []
      }),
    ]
  }
  if (ts.isArrayLiteralExpression(value))
    return value.elements.flatMap((item) =>
      storedWrappers(file, ts, sourceFile, item, context, resolving)
    )
  if (ts.isConditionalExpression(value))
    return [value.whenTrue, value.whenFalse].flatMap((item) =>
      storedWrappers(file, ts, sourceFile, item, context, resolving)
    )
  if (
    ts.isBinaryExpression(value) &&
    ['&&', '||', '??'].includes(value.operatorToken.getText())
  ) {
    return [value.left, value.right].flatMap((item) =>
      storedWrappers(file, ts, sourceFile, item, context, resolving)
    )
  }
  return [] // Calls/property reads consume or obscure a wrapper: do not guess.
}
const caseFunctions = (ts, node, context) => {
  const value = resolveValue(ts, node, context.declarations)
  if (!value) return []
  if (ts.isFunctionLike(value)) return [value]
  if (ts.isObjectLiteralExpression(value)) {
    const reducer = propertyNamed(ts, value, context.sourceFile, 'reducer')
    return reducer ? caseFunctions(ts, propertyValue(ts, reducer), context) : []
  }
  if (ts.isCallExpression(value) && ts.isPropertyAccessExpression(value.expression)) {
    const name = value.expression.name.text
    const index = name === 'preparedReducer' ? 1 : 0
    return ['reducer', 'preparedReducer'].includes(name) && value.arguments[index]
      ? caseFunctions(ts, value.arguments[index], context)
      : []
  }
  return []
}
const reducerMapFunctions = (ts, node, context) => {
  const value = resolveValue(ts, node, context.declarations)
  if (!value) return []
  if (ts.isFunctionLike(value))
    return returnedValues(ts, value).flatMap((item) =>
      reducerMapFunctions(ts, item, context)
    )
  if (!ts.isObjectLiteralExpression(value)) return []
  return value.properties.flatMap((property) => {
    const item = propertyValue(ts, property)
    return item ? caseFunctions(ts, item, context) : []
  })
}
const builderFunctions = (ts, node, context) => {
  const builder = resolveValue(ts, node, context.declarations)
  const parameter = builder?.parameters?.[0]?.name
  if (
    !builder ||
    !ts.isFunctionLike(builder) ||
    !builder.body ||
    !parameter ||
    !ts.isIdentifier(parameter)
  )
    return []
  const builderName = parameter.text
  const functions = []
  walkNodes(ts, builder.body, (candidate) => {
    if (
      !ts.isCallExpression(candidate) ||
      !ts.isPropertyAccessExpression(candidate.expression)
    )
      return
    const owner = candidate.expression.expression
    const method = candidate.expression.name.text
    if (!ts.isIdentifier(owner) || owner.text !== builderName) return
    const reducer = ['addCase', 'addMatcher', 'addDefaultCase'].includes(method)
      ? candidate.arguments.at(-1)
      : null
    if (reducer) functions.push(...caseFunctions(ts, reducer, context))
  })
  return functions
}
const reducerFindings = (file, ts, sourceFile, reducers, context) =>
  reducers.flatMap((fn) => {
    const parameter = fn.parameters[0]?.name
    const stateName = parameter && ts.isIdentifier(parameter) ? parameter.text : null
    const values = [
      ...returnedValues(ts, fn),
      ...(stateName ? reduxStoredValues(ts, fn, stateName) : []),
    ]
    return values.flatMap((value) =>
      storedWrappers(file, ts, sourceFile, value, {
        ...context,
        label: 'Redux reducer state',
      })
    )
  })
const typeFindings = (file, ts, sourceFile, roots, context) => {
  const findings = []
  const seen = new Set()
  const reviewedImports = new Set()
  const visit = (node) => {
    if (!node || seen.has(node)) return
    seen.add(node)
    if (ts.isTypeReferenceNode(node)) {
      const wrapper = wrapperTypeAt(ts, node.typeName, context.bindings)
      if (wrapper)
        findings.push(
          findingFor(
            FP_AST_RULES.serializableState,
            file,
            sourceFile,
            node,
            `rich FP wrapper type ${wrapper} declares a Redux state field`
          )
        )
      const importedName = node.typeName.getText(sourceFile)
      if (
        !wrapper &&
        importedTypeAt(ts, node.typeName, context.bindings) &&
        !transparentReduxStateTypes.has(importedName) &&
        !reviewedImports.has(importedName)
      ) {
        reviewedImports.add(importedName)
        findings.push(
          findingFor(
            FP_AST_RULES.unresolvedStateTypeReview,
            file,
            sourceFile,
            node,
            `imported Redux state type ${importedName} requires declaration review`
          )
        )
      }
      if (ts.isIdentifier(node.typeName))
        visit(context.declarations.types.get(node.typeName.text))
    }
    if (ts.isExpressionWithTypeArguments(node) && ts.isIdentifier(node.expression)) {
      visit(context.declarations.types.get(node.expression.text))
    }
    ts.forEachChild(node, visit)
  }
  roots.forEach(visit)
  return findings
}
const stateTypeRoots = (ts, stateValue, call, reducers, context) => {
  const roots = call.typeArguments?.length ? [call.typeArguments[0]] : []
  const addExpressionTypes = (node) => {
    if (!node) return
    if (ts.isIdentifier(node))
      roots.push(context.declarations.variables.get(node.text)?.type)
    if (
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isSatisfiesExpression?.(node)
    ) {
      roots.push(node.type)
      addExpressionTypes(node.expression)
    }
    const resolved = resolveValue(ts, node, context.declarations)
    if (ts.isFunctionLike(resolved)) roots.push(resolved.type)
  }
  addExpressionTypes(stateValue)
  reducers.forEach((fn) => roots.push(fn.parameters[0]?.type))
  return roots.filter(Boolean)
}
export const collectFpReduxStateFindings = (file, ts, sourceFile) => {
  const bindings = reduxBindingsFor(ts, sourceFile)
  const declarations = declarationsFor(ts, sourceFile)
  const context = { bindings, declarations, sourceFile }
  const findings = []
  walkNodes(ts, sourceFile, (node) => {
    if (!ts.isCallExpression(node)) return
    const factory = reduxFactoryAt(ts, node, bindings)
    if (!factory) return
    const config =
      factory === 'createSlice' ? resolveValue(ts, node.arguments[0], declarations) : null
    if (factory === 'createSlice' && (!config || !ts.isObjectLiteralExpression(config))) {
      findings.push(
        findingFor(
          FP_AST_RULES.unresolvedStateTypeReview,
          file,
          sourceFile,
          node.arguments[0] ?? node,
          'opaque createSlice configuration requires state-shape review'
        )
      )
      return
    }
    const initialProperty =
      config && ts.isObjectLiteralExpression(config)
        ? propertyNamed(ts, config, sourceFile, 'initialState')
        : null
    const stateValue =
      factory === 'createReducer' ? node.arguments[0] : propertyValue(ts, initialProperty)
    if (!stateValue) return
    const resolvedState = resolveValue(ts, stateValue, declarations)
    if (ts.isIdentifier(resolvedState))
      findings.push(
        findingFor(
          FP_AST_RULES.unresolvedStateTypeReview,
          file,
          sourceFile,
          stateValue,
          'opaque Redux initial-state value requires state-shape review'
        )
      )
    findings.push(
      ...storedWrappers(file, ts, sourceFile, stateValue, {
        ...context,
        label: 'Redux initial state',
      })
    )
    const reducers =
      factory === 'createReducer'
        ? [
            ...reducerMapFunctions(ts, node.arguments[1], context),
            ...builderFunctions(ts, node.arguments[1], context),
          ]
        : ['reducers', 'extraReducers'].flatMap((name) => {
            const property = propertyNamed(ts, config, sourceFile, name)
            if (!property) return []
            const value = propertyValue(ts, property)
            return name === 'extraReducers'
              ? [
                  ...reducerMapFunctions(ts, value, context),
                  ...builderFunctions(ts, value, context),
                ]
              : reducerMapFunctions(ts, value, context)
          })
    findings.push(...reducerFindings(file, ts, sourceFile, reducers, context))
    findings.push(
      ...typeFindings(
        file,
        ts,
        sourceFile,
        stateTypeRoots(ts, stateValue, node, reducers, context),
        context
      )
    )
  })
  return [
    ...new Map(
      findings.map((finding) => [
        `${finding.ruleId}:${finding.line}:${finding.column}:${finding.message}`,
        finding,
      ])
    ).values(),
  ]
}
