import {
  nodeName,
  parseSource,
  propertyNamed,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'
import {
  asyncThunkFetchNeedsCondition,
  asyncThunkHasCondition,
} from './asyncThunkRules.mjs'

const rawHookNames = new Set(['useDispatch', 'useSelector', 'useStore'])
const endpointLifecycleNames = new Set(['onQueryStarted', 'onCacheEntryAdded'])
const genericSetterName = (name) =>
  /^set[A-Z]/.test(name) || /^[A-Za-z0-9_$]+Set$/.test(name)

const callName = (typescript, node) => {
  if (!typescript.isCallExpression(node)) return ''
  if (typescript.isIdentifier(node.expression)) return node.expression.text
  return typescript.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : ''
}

const locationFor = (context, unit, sourceFile, node) =>
  `${unit.rel}:${context.lineNumber(unit.text, node.getStart(sourceFile))}`

const unwrapExpression = (typescript, node) => {
  let current = node
  while (current && typescript.isParenthesizedExpression(current))
    current = current.expression
  return current
}

const reducerObjectFor = (typescript, property) => {
  if (!property || !typescript.isPropertyAssignment(property)) return null
  const initializer = unwrapExpression(typescript, property.initializer)
  if (typescript.isObjectLiteralExpression(initializer)) return initializer
  if (
    (typescript.isArrowFunction(initializer) ||
      typescript.isFunctionExpression(initializer)) &&
    initializer.body
  ) {
    const body = unwrapExpression(typescript, initializer.body)
    return typescript.isObjectLiteralExpression(body) ? body : null
  }
  return null
}

const collectRawHookFindings = (context, unit, typescript, sourceFile) => {
  const findings = []
  const imports = []
  walkNodes(typescript, sourceFile, (node) => {
    if (
      !typescript.isImportDeclaration(node) ||
      !typescript.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== 'react-redux'
    )
      return
    const bindings = node.importClause?.namedBindings
    if (!bindings || !typescript.isNamedImports(bindings)) return
    bindings.elements.forEach((element) => {
      const imported = element.propertyName?.text ?? element.name.text
      if (rawHookNames.has(imported))
        imports.push({ node: element, local: element.name.text })
    })
  })
  imports.forEach(({ node: importNode, local }) => {
    let typedUses = 0
    walkNodes(typescript, sourceFile, (node) => {
      if (!typescript.isCallExpression(node)) return
      if (typescript.isIdentifier(node.expression) && node.expression.text === local) {
        findings.push(
          `${locationFor(context, unit, sourceFile, node)}: raw react-redux hook ${local} is called directly; export and consume a typed hook created with ${local}.withTypes()`
        )
      }
      if (
        typescript.isPropertyAccessExpression(node.expression) &&
        typescript.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === local &&
        node.expression.name.text === 'withTypes'
      )
        typedUses += 1
    })
    if (typedUses === 0) {
      findings.push(
        `${locationFor(context, unit, sourceFile, importNode)}: raw react-redux hook ${local} must be centralized through ${local}.withTypes()`
      )
    }
  })
  return findings
}

const collectReducerFindings = (context, unit, typescript, sourceFile) => {
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (
      typescript.isSwitchStatement(node) &&
      typescript.isPropertyAccessExpression(node.expression) &&
      typescript.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'action' &&
      node.expression.name.text === 'type'
    ) {
      findings.push(
        `${locationFor(context, unit, sourceFile, node)}: handwritten switch(action.type) reducer is banned; use createSlice or createReducer builder APIs`
      )
    }
    if (
      (unit.role === 'slice' || unit.role === 'reducers') &&
      typescript.isVariableDeclaration(node) &&
      typescript.isIdentifier(node.name) &&
      genericSetterName(node.name.text)
    ) {
      findings.push(
        `${locationFor(context, unit, sourceFile, node)}: reducer ${node.name.text} is setter-style; dispatch an event that names what happened`
      )
    }
    if (callName(typescript, node) !== 'createSlice') return
    const config = node.arguments[0]
    if (!config || !typescript.isObjectLiteralExpression(config)) return
    const reducers = reducerObjectFor(
      typescript,
      propertyNamed(typescript, config, sourceFile, 'reducers')
    )
    reducers?.properties.forEach((property) => {
      const name = nodeName(typescript, property.name, sourceFile)
      if (genericSetterName(name)) {
        findings.push(
          `${locationFor(context, unit, sourceFile, property)}: reducer ${name} is setter-style; dispatch an event that names what happened`
        )
      }
    })
  })
  return findings
}

const collectAsyncThunkFindings = (context, unit, typescript, sourceFile) => {
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (callName(typescript, node) !== 'createAsyncThunk') return
    if (
      asyncThunkFetchNeedsCondition(typescript, sourceFile, node) &&
      !asyncThunkHasCondition(typescript, sourceFile, node)
    ) {
      findings.push(
        `${locationFor(context, unit, sourceFile, node)}: createAsyncThunk payload creator fetches without a thunk-level condition guard`
      )
    }
  })
  return findings
}

const isLoop = (typescript, node) =>
  typescript.isWhileStatement(node) ||
  typescript.isDoStatement(node) ||
  typescript.isForStatement(node) ||
  typescript.isForInStatement(node) ||
  typescript.isForOfStatement(node)

const collectThunkPollingFindings = (context, unit, typescript, sourceFile) => {
  if (unit.role !== 'thunks') return []
  const findingLines = new Set()
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isFunctionLike(node) || !node.body) return
    let loopNode = null
    let readsState = false
    let waitsOnTimer = false
    walkNodes(typescript, node.body, (child) => {
      if (!loopNode && isLoop(typescript, child)) loopNode = child
      if (callName(typescript, child) === 'getState') readsState = true
      if (['setTimeout', 'setInterval'].includes(callName(typescript, child)))
        waitsOnTimer = true
    })
    if (loopNode && readsState && waitsOnTimer) {
      findingLines.add(
        `${locationFor(context, unit, sourceFile, loopNode)}: thunk polls future state with a loop, getState, and a timer; use listener middleware for reactive workflows`
      )
    }
  })
  return [...findingLines]
}

const isInsideLifecycle = (typescript, node, sourceFile) => {
  let current = node.parent
  while (current && current !== sourceFile) {
    if (
      (typescript.isPropertyAssignment(current) ||
        typescript.isMethodDeclaration(current)) &&
      endpointLifecycleNames.has(nodeName(typescript, current.name, sourceFile))
    )
      return true
    current = current.parent
  }
  return false
}

const collectApiAndAdapterFindings = (context, unit, typescript, sourceFile) => {
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (callName(typescript, node) === 'updateQueryData') {
      if (unit.role !== 'api' || !isInsideLifecycle(typescript, node, sourceFile)) {
        findings.push(
          `${locationFor(context, unit, sourceFile, node)}: updateQueryData belongs in an API endpoint lifecycle handler`
        )
      }
    }
  })
  return findings
}

const mutatingCollectionMethods = new Set([
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
])

const expressionRoot = (typescript, node) => {
  let current = node
  while (
    current &&
    (typescript.isPropertyAccessExpression(current) ||
      typescript.isElementAccessExpression(current))
  )
    current = current.expression
  return current
}

const collectSelectedValueMutationFindings = (context, unit, typescript, sourceFile) => {
  const selectedNames = new Set()
  walkNodes(typescript, sourceFile, (node) => {
    if (
      typescript.isVariableDeclaration(node) &&
      typescript.isIdentifier(node.name) &&
      node.initializer &&
      ['useAppSelector', 'useSelector'].includes(callName(typescript, node.initializer))
    )
      selectedNames.add(node.name.text)
  })
  const findings = []
  const isSelectedMember = (node) => {
    const root = expressionRoot(typescript, node)
    return Boolean(root && typescript.isIdentifier(root) && selectedNames.has(root.text))
  }
  const addFinding = (node) =>
    findings.push(
      `${locationFor(context, unit, sourceFile, node)}: value returned by useSelector/useAppSelector is mutated outside a reducer; dispatch an event or create an immutable copy`
    )
  walkNodes(typescript, sourceFile, (node) => {
    if (
      typescript.isBinaryExpression(node) &&
      node.operatorToken.kind >= typescript.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= typescript.SyntaxKind.LastAssignment &&
      isSelectedMember(node.left) &&
      !typescript.isIdentifier(node.left)
    )
      addFinding(node)
    if (
      (typescript.isPrefixUnaryExpression(node) ||
        typescript.isPostfixUnaryExpression(node)) &&
      [
        typescript.SyntaxKind.PlusPlusToken,
        typescript.SyntaxKind.MinusMinusToken,
      ].includes(node.operator) &&
      isSelectedMember(node.operand)
    )
      addFinding(node)
    if (
      typescript.isCallExpression(node) &&
      typescript.isPropertyAccessExpression(node.expression) &&
      mutatingCollectionMethods.has(node.expression.name.text) &&
      isSelectedMember(node.expression.expression)
    )
      addFinding(node)
  })
  return findings
}

export const collectSkillAstFindings = (context, unit) => {
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript)
    return [`${unit.rel}:1: TypeScript parser is required for Redux skill checks`]
  const sourceFile = parseSource(typescript, unit.filePath, unit.text)
  return [
    ...collectRawHookFindings(context, unit, typescript, sourceFile),
    ...collectReducerFindings(context, unit, typescript, sourceFile),
    ...collectAsyncThunkFindings(context, unit, typescript, sourceFile),
    ...collectThunkPollingFindings(context, unit, typescript, sourceFile),
    ...collectApiAndAdapterFindings(context, unit, typescript, sourceFile),
    ...collectSelectedValueMutationFindings(context, unit, typescript, sourceFile),
  ]
}
