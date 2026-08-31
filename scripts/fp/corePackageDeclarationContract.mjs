import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { blocking } from './corePackageShared.mjs'

const expectedShapes = Object.freeze({
  Maybe: {
    generics: 1,
    alternatives: [{ _tag: "'Just'", value: 'T0' }, { _tag: "'Nothing'" }],
  },
  Either: {
    generics: 2,
    alternatives: [
      { _tag: "'Left'", left: 'T0' },
      { _tag: "'Right'", right: 'T1' },
    ],
  },
  Validation: {
    generics: 2,
    alternatives: [
      { _tag: "'Failure'", errors: 'readonly T0[]' },
      { _tag: "'Success'", value: 'T1' },
    ],
  },
})

const constructorShapes = Object.freeze({
  just: { generics: 1, parameters: ['T0'], returns: 'Maybe<T0>' },
  nothing: { generics: 1, parameters: [], returns: 'Maybe<T0>', value: 'Maybe<never>' },
  left: { generics: 1, parameters: ['T0'], returns: 'Either<T0,never>' },
  right: { generics: 1, parameters: ['T0'], returns: 'Either<never,T0>' },
  success: { generics: 1, parameters: ['T0'], returns: 'Validation<never,T0>' },
  failure: {
    generics: 1,
    parameters: ['T0[]'],
    returns: 'Validation<T0,never>',
    rest: true,
  },
  ap: {
    generics: 3,
    parameters: ['Validation<T0,(T1)=>T2>', 'Validation<T0,T1>'],
    returns: 'Validation<T0,T2>',
  },
})

const exported = (node) =>
  node.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword) ?? false

const exportedNames = (sourceFile) =>
  new Set(
    sourceFile.statements.flatMap((statement) =>
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
        ? statement.exportClause.elements.map((element) => element.name.text)
        : []
    )
  )

const nameOf = (node, sourceFile) =>
  node.name ? node.name.getText(sourceFile).replace(/^['"]|['"]$/g, '') : ''

const readonlyProperty = (member) =>
  ts.isPropertySignature(member) &&
  !member.questionToken &&
  member.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ReadonlyKeyword)

const genericMap = (parameters = []) =>
  new Map(parameters.map((parameter, index) => [parameter.name.text, `T${index}`]))

const canonicalType = (type, generics, sourceFile) => {
  if (!type) return ''
  if (type.kind === ts.SyntaxKind.NeverKeyword) return 'never'
  if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) {
    return `'${type.literal.text}'`
  }
  if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
    const name = generics.get(type.typeName.text) ?? type.typeName.text
    const argumentsText = type.typeArguments?.length
      ? `<${type.typeArguments.map((argument) => canonicalType(argument, generics, sourceFile)).join(',')}>`
      : ''
    return `${name}${argumentsText}`
  }
  if (ts.isArrayTypeNode(type))
    return `${canonicalType(type.elementType, generics, sourceFile)}[]`
  if (ts.isTypeOperatorNode(type) && type.operator === ts.SyntaxKind.ReadonlyKeyword) {
    return `readonly ${canonicalType(type.type, generics, sourceFile)}`
  }
  if (ts.isFunctionTypeNode(type)) {
    const parameters = type.parameters
      .map((parameter) => canonicalType(parameter.type, generics, sourceFile))
      .join(',')
    return `(${parameters})=>${canonicalType(type.type, generics, sourceFile)}`
  }
  return [...generics].reduce(
    (text, [name, replacement]) =>
      text.replace(new RegExp(`\\b${name}\\b`, 'g'), replacement),
    type.getText(sourceFile).replace(/\s+/g, '')
  )
}

const observedShape = (type, generics, sourceFile) => {
  if (!ts.isTypeLiteralNode(type) || !type.members.every(readonlyProperty)) return null
  return Object.fromEntries(
    type.members.map((member) => [
      nameOf(member, sourceFile),
      canonicalType(member.type, generics, sourceFile),
    ])
  )
}

const sameShape = (left, right) =>
  left &&
  Object.keys(left).length === Object.keys(right).length &&
  Object.entries(right).every(([key, value]) => left[key] === value)

const typeProblems = (sourceFile, names) =>
  Object.entries(expectedShapes).flatMap(([name, expected]) => {
    const declaration = sourceFile.statements.find(
      (statement) => ts.isTypeAliasDeclaration(statement) && statement.name.text === name
    )
    if (!declaration || (!exported(declaration) && !names.has(name))) {
      return [`${name} must be an exported type alias`]
    }
    const generics = genericMap(declaration.typeParameters)
    const alternatives = ts.isUnionTypeNode(declaration.type)
      ? declaration.type.types.map((type) => observedShape(type, generics, sourceFile))
      : [observedShape(declaration.type, generics, sourceFile)]
    const valid =
      generics.size === expected.generics &&
      alternatives.length === expected.alternatives.length &&
      expected.alternatives.every((shape) =>
        alternatives.some((alternative) => sameShape(alternative, shape))
      )
    return valid ? [] : [`${name} must be exactly its readonly plain tagged alternatives`]
  })

const callableDeclaration = (sourceFile, names, name) => {
  const direct = sourceFile.statements.find(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name
  )
  if (direct) return exported(direct) || names.has(name) ? direct : null
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    const declaration = statement.declarationList.declarations.find(
      (current) => ts.isIdentifier(current.name) && current.name.text === name
    )
    if (declaration) return exported(statement) || names.has(name) ? declaration : null
  }
  return null
}

const constructorProblems = (sourceFile, names) =>
  Object.entries(constructorShapes).flatMap(([name, expected]) => {
    const declaration = callableDeclaration(sourceFile, names, name)
    if (!declaration) return [`${name} must have an exported declaration`]
    const type = declaration.type
    if (expected.value && canonicalType(type, new Map(), sourceFile) === expected.value)
      return []
    const callable =
      ts.isFunctionDeclaration(declaration) || (type && ts.isFunctionTypeNode(type))
    const signature = ts.isFunctionDeclaration(declaration) ? declaration : type
    const generics = callable ? genericMap(signature.typeParameters) : new Map()
    const parameters = callable ? signature.parameters : []
    const parameterTypes = parameters.map((parameter) =>
      canonicalType(parameter.type, generics, sourceFile)
    )
    const restValid = expected.rest
      ? parameters.length === 1 && Boolean(parameters[0].dotDotDotToken)
      : parameters.every((parameter) => !parameter.dotDotDotToken)
    return callable &&
      generics.size === expected.generics &&
      restValid &&
      parameterTypes.length === expected.parameters.length &&
      parameterTypes.every(
        (parameter, index) => parameter === expected.parameters[index]
      ) &&
      canonicalType(signature.type, generics, sourceFile) === expected.returns
      ? []
      : [
          `${name} generic parameters, input types, and ${expected.returns} result must stay coherent`,
        ]
  })

const inspectDeclaration = async (path, mode) => {
  const text = await readFile(path, 'utf8')
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const names = exportedNames(sourceFile)
  const problems = [
    ...typeProblems(sourceFile, names),
    ...constructorProblems(sourceFile, names),
  ]
  return problems.length
    ? [
        blocking(
          'FP-CORE-021',
          `${mode} declarations must expose plain discriminated Maybe/Either/Validation data and matching constructors: ${problems.join('; ')}.`,
          '71-135,321-341'
        ),
      ]
    : []
}

export const inspectCoreDeclarations = async (paths) =>
  (
    await Promise.all([
      inspectDeclaration(paths.esmTypes, 'ESM'),
      inspectDeclaration(paths.cjsTypes, 'CJS'),
    ])
  ).flat()
