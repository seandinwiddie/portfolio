import { FP_AST_RULES } from './astRules.mjs'
import { dispositionForScope } from './astScope.mjs'
import { findingFor, walkNodes } from './astShared.mjs'
import { typeNameText } from './astSignatureTypes.mjs'

export const objectShapesFor = (typescript, sourceFile) => {
  const shapes = new Map()
  walkNodes(typescript, sourceFile, (node) => {
    if (typescript.isInterfaceDeclaration(node)) {
      shapes.set(node.name.text, node.members)
    }
    if (
      typescript.isTypeAliasDeclaration(node) &&
      typescript.isTypeLiteralNode(node.type)
    ) {
      shapes.set(node.name.text, node.type.members)
    }
  })
  return shapes
}

const responsibilityCount = (typescript, parameter) =>
  typescript.isObjectBindingPattern(parameter.name) ? parameter.name.elements.length : 0

const declaredObjectProperties = (typescript, parameter, shapes) => {
  if (!parameter.type) return []
  let members = []
  if (typescript.isTypeLiteralNode(parameter.type)) members = parameter.type.members
  if (typescript.isTypeReferenceNode(parameter.type)) {
    members = shapes.get(typeNameText(typescript, parameter.type.typeName)) ?? []
  }
  return members
    .filter((member) => typescript.isPropertySignature(member) && member.name)
    .map((member) => member.name.getText().replace(/^['"]|['"]$/g, ''))
}

const optionsLikeParameter = (typescript, parameter) => {
  if (
    typescript.isIdentifier(parameter.name) &&
    /^(?:opts?|options|payload|args?|params?)$/i.test(parameter.name.text)
  )
    return true
  if (!parameter.type || !typescript.isTypeReferenceNode(parameter.type)) return false
  return /(?:Opts?|Options|Payload|Args?|Arguments|Params?)$/.test(
    typeNameText(typescript, parameter.type.typeName)
  )
}

const accessedProperties = (typescript, root, parameterName) => {
  const properties = new Set()
  let occurrences = 0
  walkNodes(typescript, root, (node) => {
    if (
      typescript.isPropertyAccessExpression(node) &&
      typescript.isIdentifier(node.expression) &&
      node.expression.text === parameterName
    ) {
      properties.add(node.name.text)
      occurrences += 1
    }
    if (
      typescript.isElementAccessExpression(node) &&
      typescript.isIdentifier(node.expression) &&
      node.expression.text === parameterName &&
      typescript.isStringLiteral(node.argumentExpression)
    ) {
      properties.add(node.argumentExpression.text)
      occurrences += 1
    }
  })
  return { properties, occurrences }
}

const firstDestructureOf = (typescript, functionNode, parameterName) => {
  if (!typescript.isBlock(functionNode.body)) return null
  const first = functionNode.body.statements[0]
  if (!first || !typescript.isVariableStatement(first)) return null
  return (
    first.declarationList.declarations.find(
      (declaration) =>
        typescript.isObjectBindingPattern(declaration.name) &&
        declaration.name.elements.length >= 3 &&
        declaration.initializer &&
        typescript.isIdentifier(declaration.initializer) &&
        declaration.initializer.text === parameterName
    ) ?? null
  )
}

const identifierUseCount = (typescript, root, name) => {
  let count = 0
  walkNodes(typescript, root, (node) => {
    if (!typescript.isIdentifier(node) || node.text !== name) return
    if (typescript.isPropertyAccessExpression(node.parent) && node.parent.name === node)
      return
    if (
      (typescript.isPropertyAssignment(node.parent) ||
        typescript.isMethodDeclaration(node.parent)) &&
      node.parent.name === node
    )
      return
    count += 1
  })
  return count
}

const payloadFinding = (file, typescript, sourceFile, parameter, message, scope) =>
  findingFor(
    FP_AST_RULES.payloadArity,
    file,
    sourceFile,
    parameter,
    message,
    optionsLikeParameter(typescript, parameter) ? dispositionForScope(scope) : 'REVIEW'
  )

export const payloadFindingsForFunction = (
  file,
  typescript,
  sourceFile,
  functionNode,
  shapes,
  scope
) =>
  functionNode.parameters.flatMap((parameter) => {
    const directCount = responsibilityCount(typescript, parameter)
    if (directCount >= 3)
      return [
        payloadFinding(
          file,
          typescript,
          sourceFile,
          parameter,
          `object parameter immediately hides ${directCount} destructured responsibilities`,
          scope
        ),
      ]
    if (!typescript.isIdentifier(parameter.name)) return []
    const parameterName = parameter.name.text
    const destructure = firstDestructureOf(typescript, functionNode, parameterName)
    if (destructure) {
      if (identifierUseCount(typescript, functionNode.body, parameterName) !== 1)
        return []
      return [
        payloadFinding(
          file,
          typescript,
          sourceFile,
          parameter,
          `object parameter ${parameterName} only hides ${destructure.name.elements.length} immediately destructured responsibilities`,
          scope
        ),
      ]
    }
    if (!optionsLikeParameter(typescript, parameter)) return []
    const declared = declaredObjectProperties(typescript, parameter, shapes)
    const accessed = accessedProperties(typescript, functionNode.body, parameterName)
    const responsibilities = declared.length
      ? declared.filter((name) => accessed.properties.has(name))
      : [...accessed.properties]
    if (responsibilities.length < 3) return []
    const retainedAsValue =
      identifierUseCount(typescript, functionNode.body, parameterName) !==
      accessed.occurrences
    return [
      findingFor(
        FP_AST_RULES.payloadArity,
        file,
        sourceFile,
        parameter,
        `options parameter ${parameterName} hides ${responsibilities.length} independently accessed responsibilities`,
        !retainedAsValue ? dispositionForScope(scope) : 'REVIEW'
      ),
    ]
  })
