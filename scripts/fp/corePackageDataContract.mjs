import { isDeepStrictEqual } from 'node:util'
import { blocking, hasOwn } from './corePackageShared.mjs'

const payload = Object.freeze({ marker: 'fp-core-contract', count: 7 })

const constructorSpecs = Object.freeze([
  Object.freeze({ name: 'just', tag: 'Just', payloadKey: 'value' }),
  Object.freeze({ name: 'nothing', tag: 'Nothing' }),
  Object.freeze({ name: 'left', tag: 'Left', payloadKey: 'left' }),
  Object.freeze({ name: 'right', tag: 'Right', payloadKey: 'right' }),
])

const invoke = (runtime, spec) => {
  const factory = runtime[spec.name]
  const value =
    spec.name === 'nothing' && typeof factory !== 'function'
      ? factory
      : typeof factory === 'function'
        ? factory(payload)
        : undefined

  return { factory, value }
}

const ownStringKeys = (value) =>
  value !== null && typeof value === 'object'
    ? Reflect.ownKeys(value)
        .filter((key) => typeof key === 'string')
        .sort()
    : []

const expectedKeys = (spec) =>
  ['_tag', ...(spec.payloadKey ? [spec.payloadKey] : [])].sort()

const hasPlainPrototype = (value) => {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasDataDescriptors = (value) =>
  Reflect.ownKeys(value).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    return (
      descriptor !== undefined &&
      hasOwn(descriptor, 'value') &&
      descriptor.enumerable === true &&
      typeof descriptor.value !== 'function'
    )
  })

const shapeProblems = (value, spec) => {
  const objectLike = value !== null && typeof value === 'object'
  const symbols = objectLike
    ? Reflect.ownKeys(value).filter((key) => typeof key === 'symbol')
    : []
  const problems = [
    ...(objectLike ? [] : ['constructor did not return an object']),
    ...(objectLike && hasPlainPrototype(value)
      ? []
      : ['result does not have a plain-object prototype']),
    ...(objectLike && isDeepStrictEqual(ownStringKeys(value), expectedKeys(spec))
      ? []
      : [`own keys must be exactly ${expectedKeys(spec).join(', ') || '(none)'}`]),
    ...(symbols.length === 0 ? [] : ['symbol fields are not plain data']),
    ...(objectLike && hasDataDescriptors(value)
      ? []
      : ['fields must be enumerable data fields without methods or closures']),
    ...(objectLike && value._tag === spec.tag ? [] : [`_tag must be ${spec.tag}`]),
  ]

  return problems
}

const roundTrip = (value) =>
  Promise.resolve().then(() => JSON.parse(JSON.stringify(value)))

const jsonFinding = async (value, spec, mode) => {
  const expected = {
    _tag: spec.tag,
    ...(spec.payloadKey ? { [spec.payloadKey]: payload } : {}),
  }
  const result = await roundTrip(value).then(
    (hydrated) => ({ _tag: 'Right', hydrated }),
    (error) => ({ _tag: 'Left', error })
  )
  const retained = result._tag === 'Right' && isDeepStrictEqual(result.hydrated, expected)

  return retained
    ? []
    : [
        blocking(
          'FP-CORE-007',
          `${mode} ${spec.name} must preserve its ${spec.payloadKey ?? 'tag'} as plain data through JSON serialization and hydration${
            result._tag === 'Left' ? ` (${result.error.message})` : ''
          }.`,
          '71-100'
        ),
      ]
}

const inspectConstructor = async (runtime, contract) => {
  const { factory, value } = invoke(runtime, contract.spec)
  const problems = shapeProblems(value, contract.spec)
  const missingConstructor =
    contract.spec.name === 'nothing'
      ? factory === undefined
      : typeof factory !== 'function'
  const shapeFindings =
    problems.length === 0 && !missingConstructor
      ? []
      : [
          blocking(
            'FP-CORE-006',
            `${contract.mode} ${contract.spec.name} must construct plain tagged data without method or closure fields: ${[
              ...(missingConstructor ? ['constructor export is missing'] : []),
              ...problems,
            ].join('; ')}.`,
            '71-100'
          ),
        ]
  const serializationFindings = contract.spec.payloadKey
    ? await jsonFinding(value, contract.spec, contract.mode)
    : []

  return [...shapeFindings, ...serializationFindings]
}

export const inspectRuntimeData = async (runtime, mode) =>
  (
    await Promise.all(
      constructorSpecs.map((spec) => inspectConstructor(runtime, { mode, spec }))
    )
  ).flat()
