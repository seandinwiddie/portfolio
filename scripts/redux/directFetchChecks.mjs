import { parseSource, resolveTypescript, walkNodes } from './typescriptAst.mjs'
import {
  asyncThunkFetchNeedsCondition,
  asyncThunkHasCondition,
} from './asyncThunkRules.mjs'

const callNamed = (typescript, node, name) =>
  typescript.isCallExpression(node) &&
  typescript.isIdentifier(node.expression) &&
  node.expression.text === name

const insideAllowedAsyncThunk = (typescript, sourceFile, fetchCall) => {
  let current = fetchCall.parent
  while (current && current !== sourceFile) {
    if (callNamed(typescript, current, 'createAsyncThunk')) {
      const payloadCreator = current.arguments[1]
      const insidePayload =
        payloadCreator &&
        fetchCall.getStart(sourceFile) >= payloadCreator.getStart(sourceFile) &&
        fetchCall.getEnd() <= payloadCreator.getEnd()
      const needsCondition = asyncThunkFetchNeedsCondition(
        typescript,
        sourceFile,
        current
      )
      return Boolean(
        insidePayload &&
          (!needsCondition || asyncThunkHasCondition(typescript, sourceFile, current))
      )
    }
    current = current.parent
  }
  return false
}

const isApprovedWrapper = (context, filePath) => {
  const relative = `/${context.relativeToProject(filePath)}`
  return (
    /\/apiApi\.[^/]+$/.test(relative) ||
    /\/baseQuery\.[^/]+$/.test(relative) ||
    /\/(?:features\/api|systems\/api)\/endpoints\/[^/]+\.[^/]+$/.test(relative)
  )
}

const findingsForFile = (context, typescript, filePath) => {
  if (isApprovedWrapper(context, filePath)) return []
  const text = context.readText(filePath)
  const sourceFile = parseSource(typescript, filePath, text)
  const findings = []
  walkNodes(typescript, sourceFile, (node) => {
    if (
      callNamed(typescript, node, 'fetch') &&
      !insideAllowedAsyncThunk(typescript, sourceFile, node)
    ) {
      const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
      findings.push(
        `${context.relativeToProject(filePath)}:${location.line + 1}: direct fetch is only allowed in approved RTK wrappers or a createAsyncThunk payload creator with a thunk-level condition`
      )
    }
  })
  return findings
}

export const collectDirectFetchFindings = (context) => {
  const typescript = resolveTypescript(context.projectRoot)
  return typescript
    ? context.sourceFiles.flatMap((filePath) =>
        findingsForFile(context, typescript, filePath)
      )
    : ['TypeScript parser is required for direct-fetch ownership checks']
}
