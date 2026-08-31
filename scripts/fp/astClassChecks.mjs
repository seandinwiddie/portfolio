import { FRAMEWORK_CLASS_MARKER, FP_AST_RULES } from './astRules.mjs'
import { findingFor, functionOwner, markerReason, walkNodes } from './astShared.mjs'

const classOwner = (typescript, node) => {
  if (typescript.isClassExpression(node) && typescript.isVariableDeclaration(node.parent))
    return node.parent.parent.parent
  return node
}

const className = (typescript, node, sourceFile) => {
  if (node.name) return node.name.getText(sourceFile)
  if (typescript.isClassExpression(node) && typescript.isVariableDeclaration(node.parent))
    return node.parent.name.getText(sourceFile)
  return '<anonymous>'
}

const unwrapStatementExpression = (typescript, expression) => {
  let current = expression
  while (
    current &&
    (typescript.isParenthesizedExpression(current) ||
      typescript.isAwaitExpression(current) ||
      typescript.isVoidExpression(current))
  )
    current = current.expression
  return current
}

const isReferenceExpression = (typescript, expression) => {
  const value = unwrapStatementExpression(typescript, expression)
  if (!value) return false
  if (
    typescript.isIdentifier(value) ||
    value.kind === typescript.SyntaxKind.ThisKeyword ||
    value.kind === typescript.SyntaxKind.SuperKeyword
  )
    return true
  return (
    (typescript.isPropertyAccessExpression(value) ||
      typescript.isElementAccessExpression(value)) &&
    isReferenceExpression(typescript, value.expression)
  )
}

const isDelegatedCall = (typescript, expression) => {
  const value = unwrapStatementExpression(typescript, expression)
  return (
    typescript.isCallExpression(value) &&
    isReferenceExpression(typescript, value.expression)
  )
}

const isDelegationStatement = (typescript, statement) => {
  if (typescript.isEmptyStatement(statement)) return true
  if (typescript.isReturnStatement(statement)) {
    return (
      Boolean(statement.expression) &&
      (isReferenceExpression(typescript, statement.expression) ||
        isDelegatedCall(typescript, statement.expression))
    )
  }
  return (
    typescript.isExpressionStatement(statement) &&
    isDelegatedCall(typescript, statement.expression)
  )
}

const parameterPropertyModifiers = new Set([
  'PrivateKeyword',
  'ProtectedKeyword',
  'PublicKeyword',
  'ReadonlyKeyword',
])

const hasParameterProperty = (typescript, member) =>
  typescript.isConstructorDeclaration(member) &&
  member.parameters.some((parameter) =>
    parameter.modifiers?.some((modifier) =>
      parameterPropertyModifiers.has(typescript.SyntaxKind[modifier.kind])
    )
  )

const isThinFrameworkClass = (typescript, node) => {
  if (node.members.length > 2) return false
  return node.members.every((member) => {
    const methodLike =
      typescript.isConstructorDeclaration(member) ||
      typescript.isMethodDeclaration(member) ||
      typescript.isGetAccessorDeclaration(member) ||
      typescript.isSetAccessorDeclaration(member)
    if (!methodLike) return false
    if (hasParameterProperty(typescript, member)) return false
    if (!member.body) return true
    return (
      member.body.statements.length <= 1 &&
      member.body.statements.every((statement) =>
        isDelegationStatement(typescript, statement)
      )
    )
  })
}

const memberPath = (typescript, node) => {
  const value = unwrapStatementExpression(typescript, node)
  if (typescript.isIdentifier(value)) return [value.text]
  if (!typescript.isPropertyAccessExpression(value)) return []
  return [...memberPath(typescript, value.expression), value.name.text]
}

const endsWithPath = (path, suffix) =>
  suffix.every((part, index) => path.at(index - suffix.length) === part)

const jsPrototypeInheritance = (typescript, node) => {
  if (
    typescript.isBinaryExpression(node) &&
    node.operatorToken.kind === typescript.SyntaxKind.EqualsToken
  ) {
    const left = memberPath(typescript, node.left)
    const right = memberPath(typescript, node.right)
    const objectCreate =
      typescript.isCallExpression(unwrapStatementExpression(typescript, node.right)) &&
      endsWithPath(
        memberPath(
          typescript,
          unwrapStatementExpression(typescript, node.right).expression
        ),
        ['Object', 'create']
      )
    if (
      (endsWithPath(left, ['prototype']) &&
        (objectCreate || endsWithPath(right, ['prototype']))) ||
      (endsWithPath(left, ['__proto__']) && right.length > 0)
    )
      return 'JavaScript prototype assignment inheritance'
  }
  if (!typescript.isCallExpression(node)) return null
  const callee = memberPath(typescript, node.expression)
  const setsPrototype =
    endsWithPath(callee, ['Object', 'setPrototypeOf']) ||
    endsWithPath(callee, ['Reflect', 'setPrototypeOf'])
  const inherits = endsWithPath(callee, ['util', 'inherits'])
  return (setsPrototype && node.arguments.length >= 2) ||
    (inherits && node.arguments.length >= 2)
    ? 'JavaScript prototype-call inheritance'
    : null
}

const acceptedFrameworkClasses = (typescript, sourceFile) => {
  const accepted = new Set()
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isClassDeclaration(node) && !typescript.isClassExpression(node))
      return
    const owner = classOwner(typescript, node)
    const reason = markerReason(typescript, sourceFile, owner, FRAMEWORK_CLASS_MARKER)
    if (reason && isThinFrameworkClass(typescript, node)) accepted.add(node)
  })
  return accepted
}

const ownedNewExpressions = (typescript, functionNode) => {
  const expressions = []
  const visit = (node) => {
    if (node !== functionNode && typescript.isFunctionLike(node)) return
    if (typescript.isNewExpression(node)) expressions.push(node)
    typescript.forEachChild(node, visit)
  }
  visit(functionNode)
  return expressions
}

const isThinFrameworkFunction = (typescript, node) => {
  if (node.parameters.length > 2 || !node.body) return false
  if (!typescript.isBlock(node.body)) {
    return typescript.isNewExpression(unwrapStatementExpression(typescript, node.body))
  }
  const [statement] = node.body.statements
  return (
    node.body.statements.length === 1 &&
    typescript.isReturnStatement(statement) &&
    Boolean(statement.expression) &&
    typescript.isNewExpression(
      unwrapStatementExpression(typescript, statement.expression)
    )
  )
}

const acceptedFrameworkNews = (typescript, sourceFile) => {
  const accepted = new Set()
  walkNodes(typescript, sourceFile, (node) => {
    if (!typescript.isFunctionLike(node) || !node.body) return
    const reason = markerReason(
      typescript,
      sourceFile,
      functionOwner(typescript, node),
      FRAMEWORK_CLASS_MARKER
    )
    const expressions = ownedNewExpressions(typescript, node)
    if (reason && expressions.length === 1 && isThinFrameworkFunction(typescript, node)) {
      accepted.add(expressions[0])
    }
  })
  return accepted
}

const nearestClass = (typescript, node) => {
  let current = node.parent
  while (current) {
    if (typescript.isClassDeclaration(current) || typescript.isClassExpression(current)) {
      return current
    }
    current = current.parent
  }
  return null
}

const newTargetsAcceptedClass = (typescript, node, acceptedNames) =>
  typescript.isIdentifier(node.expression) && acceptedNames.has(node.expression.text)

export const collectFpClassFindings = (file, typescript, sourceFile) => {
  const rule = FP_AST_RULES.classMechanics
  const findings = []
  const accepted = acceptedFrameworkClasses(typescript, sourceFile)
  const acceptedNews = acceptedFrameworkNews(typescript, sourceFile)
  const acceptedNames = new Set(
    [...accepted].map((node) => className(typescript, node, sourceFile))
  )
  walkNodes(typescript, sourceFile, (node) => {
    if (typescript.isClassDeclaration(node) || typescript.isClassExpression(node)) {
      if (!accepted.has(node)) {
        const owner = classOwner(typescript, node)
        const annotated =
          markerReason(typescript, sourceFile, owner, FRAMEWORK_CLASS_MARKER) !== null
        const detail = annotated
          ? `class ${className(typescript, node, sourceFile)} is not a thin annotated framework boundary`
          : `class ${className(typescript, node, sourceFile)} is not an annotated framework boundary`
        findings.push(findingFor(rule, file, sourceFile, node, detail))
      } else {
        findings.push(
          findingFor(
            FP_AST_RULES.documentedException,
            file,
            sourceFile,
            node,
            `documented framework class exception for ${className(typescript, node, sourceFile)}; confirm the framework or reflection boundary truly requires it`
          )
        )
      }
      return
    }
    const prototypeInheritance = jsPrototypeInheritance(typescript, node)
    if (prototypeInheritance) {
      findings.push(findingFor(rule, file, sourceFile, node, prototypeInheritance))
      return
    }
    const containingClass = nearestClass(typescript, node)
    const inAcceptedClass = containingClass && accepted.has(containingClass)
    if (
      typescript.isHeritageClause(node) &&
      node.token === typescript.SyntaxKind.ExtendsKeyword
    ) {
      if (!accepted.has(node.parent)) {
        findings.push(
          findingFor(rule, file, sourceFile, node, 'class inheritance via extends')
        )
      }
    } else if (node.kind === typescript.SyntaxKind.ThisKeyword && !inAcceptedClass) {
      findings.push(findingFor(rule, file, sourceFile, node, '`this` class mechanic'))
    } else if (node.kind === typescript.SyntaxKind.SuperKeyword && !inAcceptedClass) {
      findings.push(findingFor(rule, file, sourceFile, node, '`super` class mechanic'))
    } else if (
      typescript.isIdentifier(node) &&
      node.text === 'self' &&
      ((typescript.isVariableDeclaration(node.parent) && node.parent.name === node) ||
        (typescript.isParameter(node.parent) && node.parent.name === node))
    ) {
      findings.push(findingFor(rule, file, sourceFile, node, '`self` class alias'))
    } else if (
      typescript.isNewExpression(node) &&
      !inAcceptedClass &&
      !newTargetsAcceptedClass(typescript, node, acceptedNames)
    ) {
      findings.push(
        acceptedNews.has(node)
          ? findingFor(
              FP_AST_RULES.documentedException,
              file,
              sourceFile,
              node,
              'documented framework constructor exception; confirm construction is required and the adapter remains thin'
            )
          : findingFor(rule, file, sourceFile, node, '`new` class construction')
      )
    }
  })
  return findings
}
