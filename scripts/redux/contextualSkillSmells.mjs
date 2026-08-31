import {
  nodeName,
  parseSource,
  propertyNamed,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'
import { skillDirectoryOf } from '../skill-paths.mjs'

const skillPath = (directory) => skillDirectoryOf(directory)

const stateOwnerCalls = new Set([
  'createContext',
  'useContext',
  'useLocation',
  'useParams',
  'useReducer',
  'useSearchParams',
  'useState',
])
const allocatingCalls = new Set(['concat', 'filter', 'flatMap', 'map', 'slice'])

const callName = (typescript, node) => {
  if (!typescript.isCallExpression(node)) return ''
  if (typescript.isIdentifier(node.expression)) return node.expression.text
  return typescript.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : ''
}

const unwrap = (typescript, node) => {
  let current = node
  while (current && typescript.isParenthesizedExpression(current))
    current = current.expression
  return current
}

const returnedExpressions = (typescript, callback) => {
  if (
    !callback ||
    (!typescript.isArrowFunction(callback) && !typescript.isFunctionExpression(callback))
  ) {
    return []
  }
  const body = unwrap(typescript, callback.body)
  if (!typescript.isBlock(body)) return [body]
  const returns = []
  body.statements.forEach((statement) => {
    if (typescript.isReturnStatement(statement) && statement.expression) {
      returns.push(unwrap(typescript, statement.expression))
    }
  })
  return returns
}

const isAllocation = (typescript, node) => {
  const value = unwrap(typescript, node)
  return (
    typescript.isArrayLiteralExpression(value) ||
    typescript.isObjectLiteralExpression(value) ||
    typescript.isNewExpression(value) ||
    (typescript.isCallExpression(value) &&
      allocatingCalls.has(callName(typescript, value)))
  )
}

const unstableSelection = (typescript, expression) => {
  if (
    typescript.isArrayLiteralExpression(expression) ||
    typescript.isNewExpression(expression)
  ) {
    return expression
  }
  if (!typescript.isObjectLiteralExpression(expression)) {
    return isAllocation(typescript, expression) ? expression : null
  }
  for (const property of expression.properties) {
    if (
      typescript.isPropertyAssignment(property) &&
      isAllocation(typescript, property.initializer)
    )
      return property.initializer
    if (typescript.isSpreadAssignment(property)) return property
  }
  return null
}

const stateOwnershipNotice = (context, filePath, sourceFile, node, name) => ({
  level: 'SMELL',
  skill: 'model-redux-state/design-state-ownership',
  skillFile: `${skillPath('model-redux-state-design-state-ownership')}/SKILL.md`,
  reference:
    'https://redux.js.org/style-guide/#evaluate-where-each-piece-of-state-should-live',
  guidance: `${context.relativeToProject(filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: ${name} establishes or reads another state owner; review whether the value belongs locally, in the URL/router, in an external cache, or in Redux.`,
})

const unstableSelectionNotice = (context, filePath, sourceFile, node) => ({
  level: 'SMELL',
  skill: 'evolve-and-diagnose-redux-apps/debug-redux-toolkit-apps',
  skillFile: `${skillPath('evolve-and-diagnose-redux-apps-debug-redux-toolkit-apps')}/SKILL.md`,
  reference:
    'https://redux-toolkit.js.org/rtk-query/usage/queries#selecting-data-from-a-query-result',
  guidance: `${context.relativeToProject(filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: selectFromResult returns a newly allocated value; review reference stability or memoize the derived value outside the callback.`,
})

const workflowNotice = (context, filePath, sourceFile, node) => ({
  level: 'SMELL',
  skill: 'orchestrate-side-effects/handle-side-effects',
  skillFile: `${skillPath('orchestrate-side-effects-handle-side-effects')}/SKILL.md`,
  reference: 'https://redux-toolkit.js.org/api/createListenerMiddleware',
  guidance: `${context.relativeToProject(filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: an effect dispatches store work; review whether this is a mount request guarded by its thunk condition or a reactive workflow that belongs in listener middleware.`,
})

const broadSubscriptionNotice = (context, filePath, sourceFile, node) => ({
  level: 'SMELL',
  skill: 'evolve-and-diagnose-redux-apps/debug-redux-toolkit-apps',
  skillFile: `${skillPath('evolve-and-diagnose-redux-apps-debug-redux-toolkit-apps')}/SKILL.md`,
  reference:
    'https://redux.js.org/tutorials/fundamentals/part-5-ui-react#selecting-data-in-list-items-by-id',
  guidance: `${context.relativeToProject(filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: selector subscription appears broad; review whether the component can subscribe to only the values it renders.`,
})

const adapterIdentityNotice = (context, filePath, sourceFile, node) => ({
  level: 'SMELL',
  skill: 'model-redux-state/build-slices-and-selectors',
  skillFile: `${skillPath('model-redux-state-build-slices-and-selectors')}/SKILL.md`,
  reference: 'https://redux-toolkit.js.org/api/createEntityAdapter#selectid',
  guidance: `${context.relativeToProject(filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: createEntityAdapter relies on the conventional entity.id default; review and declare selectId when the entity uses another key.`,
})

const subtreeHasDispatch = (typescript, root) => {
  let found = false
  if (!root) return found
  walkNodes(typescript, root, (node) => {
    if (callName(typescript, node) === 'dispatch') found = true
  })
  return found
}

const directlyReturnsParameter = (typescript, callback) => {
  if (!callback || !typescript.isArrowFunction(callback)) return false
  const [parameter] = callback.parameters
  if (!parameter || !typescript.isIdentifier(parameter.name)) return false
  const body = unwrap(typescript, callback.body)
  return typescript.isIdentifier(body) && body.text === parameter.name.text
}

const isBroadSelectorCall = (typescript, node) => {
  if (!['useAppSelector', 'useSelector'].includes(callName(typescript, node)))
    return false
  const selector = node.arguments[0]
  return (
    directlyReturnsParameter(typescript, selector) ||
    Boolean(
      selector &&
        typescript.isIdentifier(selector) &&
        /^select[A-Za-z0-9_$]*State$/.test(selector.text)
    )
  )
}

const smellsForFile = (context, typescript, filePath) => {
  const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
  const notices = []
  walkNodes(typescript, sourceFile, (node) => {
    const name = callName(typescript, node)
    if (stateOwnerCalls.has(name)) {
      notices.push(stateOwnershipNotice(context, filePath, sourceFile, node, name))
    }
    if (name === 'useEffect' && subtreeHasDispatch(typescript, node.arguments[0])) {
      notices.push(workflowNotice(context, filePath, sourceFile, node))
    }
    if (isBroadSelectorCall(typescript, node)) {
      notices.push(broadSubscriptionNotice(context, filePath, sourceFile, node))
    }
    if (name === 'createEntityAdapter') {
      const options = node.arguments[0]
      const hasSelectId =
        options &&
        typescript.isObjectLiteralExpression(options) &&
        propertyNamed(typescript, options, sourceFile, 'selectId')
      if (!hasSelectId) {
        notices.push(adapterIdentityNotice(context, filePath, sourceFile, node))
      }
    }
    if (
      !typescript.isPropertyAssignment(node) ||
      nodeName(typescript, node.name, sourceFile) !== 'selectFromResult'
    )
      return
    returnedExpressions(typescript, node.initializer).forEach((expression) => {
      const allocation = unstableSelection(typescript, expression)
      if (allocation) {
        notices.push(unstableSelectionNotice(context, filePath, sourceFile, allocation))
      }
    })
  })
  return notices
}

export const collectContextualSkillSmells = (context) => {
  const typescript = resolveTypescript(context.projectRoot)
  return typescript
    ? context.sourceFiles.flatMap((filePath) =>
        smellsForFile(context, typescript, filePath)
      )
    : []
}
