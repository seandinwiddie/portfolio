import { isDeepStrictEqual } from 'node:util'
import { blocking } from './corePackageShared.mjs'

const capabilitySpecs = Object.freeze([
  Object.freeze({
    code: 'FP-CORE-010',
    label: 'left-to-right pipe composition',
    names: ['pipe'],
    lines: '145-154,297-307',
  }),
  Object.freeze({
    code: 'FP-CORE-011',
    label: 'partial application',
    names: ['partial'],
    lines: '145-154',
  }),
  Object.freeze({
    code: 'FP-CORE-012',
    label: 'predicate combinators',
    names: ['both', 'either', 'allPass', 'complement'],
    lines: '239-242,285-295',
  }),
  Object.freeze({
    code: 'FP-CORE-013',
    label: 'Traversable sequence',
    names: ['sequence'],
    lines: '166-187',
  }),
  Object.freeze({
    code: 'FP-CORE-014',
    label: 'stack-safe trampoline',
    names: ['trampoline'],
    lines: '145-154,260-283',
  }),
  Object.freeze({
    code: 'FP-CORE-015',
    label: 'Monoid concat and empty',
    names: ['concat', 'empty'],
    lines: '166-187',
  }),
  Object.freeze({
    code: 'FP-CORE-008',
    label: 'Validation constructors and applicative ap',
    names: ['success', 'failure', 'ap'],
    lines: '109-135,189-212',
  }),
])

const surfaceLocations = (surfaces) => [
  ['ESM declarations', surfaces.esm.declared],
  ['CJS declarations', surfaces.cjs.declared],
  ['ESM runtime', surfaces.esm.runtime],
  ['CJS runtime', surfaces.cjs.runtime],
]

const missingAt = (location, names) => {
  const [label, exports] = location
  const missing = names.filter((name) => !exports.includes(name))
  return missing.length === 0 ? [] : [`missing from ${label}: ${missing.join(', ')}`]
}

const capabilityFinding = (surfaces, spec) => {
  const missing = surfaceLocations(surfaces).flatMap((location) =>
    missingAt(location, spec.names)
  )

  return missing.length === 0
    ? []
    : [
        blocking(
          spec.code,
          `${spec.label} must be declared and available from both ESM and CJS (${missing.join('; ')}).`,
          spec.lines
        ),
      ]
}

export const inspectCapabilities = (surfaces) =>
  capabilitySpecs.flatMap((spec) => capabilityFinding(surfaces, spec))

const attempt = (operation) =>
  Promise.resolve()
    .then(operation)
    .then(
      (value) => ({ _tag: 'Right', value }),
      (error) => ({ _tag: 'Left', error })
    )

const isTagged = (value, contract) => {
  const objectLike = value !== null && typeof value === 'object'
  const keys = objectLike ? Reflect.ownKeys(value).sort() : []
  const expectedKeys = ['_tag', contract.payloadKey].sort()
  const prototype = objectLike ? Object.getPrototypeOf(value) : undefined
  const noChain = objectLike ? !('chain' in value) : false

  return (
    objectLike &&
    (prototype === Object.prototype || prototype === null) &&
    isDeepStrictEqual(keys, expectedKeys) &&
    value._tag === contract.tag &&
    noChain
  )
}

const validationObservation = (runtime) => {
  const success = runtime.success(7)
  const first = runtime.failure('first')
  const second = runtime.failure('second')
  const accumulated = runtime.ap(first, second)
  const applied = runtime.ap(
    runtime.success((value) => value + 1),
    success
  )
  const identity = runtime.ap(
    runtime.success((value) => value),
    success
  )

  return { success, first, second, accumulated, applied, identity }
}

const validationProblems = (observation) => [
  ...(isTagged(observation.success, {
    tag: 'Success',
    payloadKey: 'value',
  }) && observation.success.value === 7
    ? []
    : ['success(value) must produce plain Success.value data with no chain']),
  ...(isTagged(observation.first, {
    tag: 'Failure',
    payloadKey: 'errors',
  }) && isDeepStrictEqual(observation.first.errors, ['first'])
    ? []
    : ['failure(error) must produce plain Failure.errors data with no chain']),
  ...(isTagged(observation.accumulated, {
    tag: 'Failure',
    payloadKey: 'errors',
  }) && isDeepStrictEqual(observation.accumulated.errors, ['first', 'second'])
    ? []
    : ['ap must accumulate both independent failures in order']),
  ...(isTagged(observation.applied, {
    tag: 'Success',
    payloadKey: 'value',
  }) && observation.applied.value === 8
    ? []
    : ['ap must apply a successful function to a successful value']),
  ...(isTagged(observation.identity, {
    tag: 'Success',
    payloadKey: 'value',
  }) && observation.identity.value === 7
    ? []
    : ['Applicative identity requires ap(success(identity), value) to equal value']),
]

export const inspectValidation = async (runtime, mode) => {
  const result = await attempt(() => validationObservation(runtime))
  const problems =
    result._tag === 'Left'
      ? [`Validation operations threw: ${result.error.message}`]
      : validationProblems(result.value)

  return problems.length === 0
    ? []
    : [
        blocking(
          'FP-CORE-009',
          `${mode} Validation must use plain Success.value and Failure.errors data, omit chain, and accumulate independent failures: ${problems.join('; ')}.`,
          '109-135,189-212'
        ),
      ]
}

export const inspectMonoid = async (runtime, mode) => {
  if (typeof runtime.concat !== 'function' || runtime.empty === undefined) return []
  const result = await attempt(() => {
    const empty = typeof runtime.empty === 'function' ? runtime.empty() : runtime.empty
    const left = [1]
    const middle = [2]
    const right = [3]
    return {
      leftIdentity: runtime.concat(empty, left),
      rightIdentity: runtime.concat(left, empty),
      associatedLeft: runtime.concat(runtime.concat(left, middle), right),
      associatedRight: runtime.concat(left, runtime.concat(middle, right)),
    }
  })
  const lawful =
    result._tag === 'Right' &&
    isDeepStrictEqual(result.value.leftIdentity, [1]) &&
    isDeepStrictEqual(result.value.rightIdentity, [1]) &&
    isDeepStrictEqual(result.value.associatedLeft, result.value.associatedRight)

  return lawful
    ? []
    : [
        blocking(
          'FP-CORE-018',
          `${mode} Monoid concat/empty must obey left identity, right identity, and associativity${result._tag === 'Left' ? ` (${result.error.message})` : ''}.`,
          '166-187,538-560'
        ),
      ]
}
