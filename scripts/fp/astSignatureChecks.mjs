import { FP_AST_RULES } from './astRules.mjs'
import { findingFor, functionName, walkNodes } from './astShared.mjs'
import { objectShapesFor, payloadFindingsForFunction } from './astSignaturePayloads.mjs'
import { callableAliasesFor, parameterKind } from './astSignatureTypes.mjs'

export const collectFpSignatureFindings = (
  file,
  typescript,
  sourceFile,
  { scope = 'core' } = {}
) => {
  const findings = []
  const aliases = callableAliasesFor(typescript, sourceFile)
  const shapes = objectShapesFor(typescript, sourceFile)
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isFunctionLike(node) || !node.body) return
    const parameterKinds = node.parameters.map((parameter) => ({
      parameter,
      kind: parameterKind(typescript, node, parameter, aliases),
    }))
    const dataParameters = parameterKinds.filter(({ kind }) => kind === 'data')
    const uncertainParameters = parameterKinds.filter(({ kind }) => kind === 'uncertain')
    if (dataParameters.length > 2) {
      findings.push(
        findingFor(
          FP_AST_RULES.dataArity,
          file,
          sourceFile,
          node,
          `function ${functionName(typescript, node, sourceFile)} has ${dataParameters.length} data parameters`
        )
      )
    } else if (dataParameters.length + uncertainParameters.length > 2) {
      findings.push(
        findingFor(
          FP_AST_RULES.callbackTypeReview,
          file,
          sourceFile,
          uncertainParameters[0].parameter,
          `function ${functionName(typescript, node, sourceFile)} stays under the data-arity limit only because ${uncertainParameters.length} unresolved callable parameter type(s) require review`
        )
      )
    }
    findings.push(
      ...payloadFindingsForFunction(file, typescript, sourceFile, node, shapes, scope)
    )
  })
  return findings
}
