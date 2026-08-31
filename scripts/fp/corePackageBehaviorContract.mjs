import { isDeepStrictEqual } from 'node:util'
import { blocking } from './corePackageShared.mjs'

const attempt = (operation) => {
  try {
    return { _tag: 'Right', value: operation() }
  } catch (error) {
    return { _tag: 'Left', error }
  }
}

const behaviorFinding = (mode, contract, problems) =>
  problems.length
    ? [
        blocking(
          contract.code,
          `${mode} ${contract.label} behavior is invalid: ${problems.join('; ')}.`,
          contract.lines
        ),
      ]
    : []

const inspectPipe = (runtime, mode) => {
  if (typeof runtime.pipe !== 'function') return []
  const result = attempt(() => {
    const order = []
    const value = runtime.pipe(
      2,
      (current) => {
        order.push('first')
        return current + 3
      },
      (current) => {
        order.push('second')
        return current * 4
      }
    )
    return { order, value }
  })
  const valid =
    result._tag === 'Right' &&
    result.value.value === 20 &&
    isDeepStrictEqual(result.value.order, ['first', 'second'])
  return behaviorFinding(
    mode,
    {
      code: 'FP-CORE-010',
      label: 'left-to-right pipe composition',
      lines: '145-154,297-307',
    },
    valid
      ? []
      : [
          result._tag === 'Left'
            ? result.error.message
            : 'transforms did not run left-to-right',
        ]
  )
}

const inspectPartial = (runtime, mode) => {
  if (typeof runtime.partial !== 'function') return []
  const result = attempt(() =>
    runtime.partial((...values) => values, 'stable-a', 'stable-b')('dynamic')
  )
  const valid =
    result._tag === 'Right' &&
    isDeepStrictEqual(result.value, ['stable-a', 'stable-b', 'dynamic'])
  return behaviorFinding(
    mode,
    {
      code: 'FP-CORE-011',
      label: 'partial application',
      lines: '145-154',
    },
    valid
      ? []
      : [
          result._tag === 'Left'
            ? result.error.message
            : 'captured inputs were not applied before remaining inputs',
        ]
  )
}

const inspectPredicates = (runtime, mode) => {
  const names = ['both', 'either', 'allPass', 'complement']
  if (names.some((name) => typeof runtime[name] !== 'function')) return []
  const result = attempt(() => {
    const positive = (value) => value > 0
    const even = (value) => value % 2 === 0
    return {
      both: [runtime.both(positive, even)(2), runtime.both(positive, even)(3)],
      either: [runtime.either(positive, even)(-2), runtime.either(positive, even)(-3)],
      allPass: [
        runtime.allPass([positive, even])(4),
        runtime.allPass([positive, even])(-4),
      ],
      complement: [runtime.complement(positive)(-1), runtime.complement(positive)(1)],
    }
  })
  const expected = {
    both: [true, false],
    either: [true, false],
    allPass: [true, false],
    complement: [true, false],
  }
  const valid = result._tag === 'Right' && isDeepStrictEqual(result.value, expected)
  return behaviorFinding(
    mode,
    {
      code: 'FP-CORE-012',
      label: 'predicate combinator',
      lines: '239-242,285-295',
    },
    valid
      ? []
      : [result._tag === 'Left' ? result.error.message : 'truth-table composition failed']
  )
}

const nothingFrom = (runtime) =>
  typeof runtime.nothing === 'function' ? runtime.nothing() : runtime.nothing

const inspectSequence = (runtime, mode) => {
  if (typeof runtime.sequence !== 'function' || typeof runtime.just !== 'function')
    return []
  const result = attempt(() => ({
    present: runtime.sequence([runtime.just(1), runtime.just(2)]),
    absent: runtime.sequence([runtime.just(1), nothingFrom(runtime)]),
    empty: runtime.sequence([]),
  }))
  const valid =
    result._tag === 'Right' &&
    isDeepStrictEqual(result.value.present, { _tag: 'Just', value: [1, 2] }) &&
    isDeepStrictEqual(result.value.absent, { _tag: 'Nothing' }) &&
    isDeepStrictEqual(result.value.empty, { _tag: 'Just', value: [] })
  return behaviorFinding(
    mode,
    {
      code: 'FP-CORE-013',
      label: 'Traversable sequence',
      lines: '166-187',
    },
    valid
      ? []
      : [
          result._tag === 'Left'
            ? result.error.message
            : 'presence, absence, or empty traversal was incorrect',
        ]
  )
}

const bounceFrom = (remaining, value) =>
  remaining === 0
    ? { _tag: 'Done', value }
    : { _tag: 'Call', next: () => bounceFrom(remaining - 1, value) }

const inspectTrampoline = (runtime, mode) => {
  if (typeof runtime.trampoline !== 'function') return []
  const expected = 50_000
  const result = attempt(() => runtime.trampoline(bounceFrom(expected, expected)))
  const valid = result._tag === 'Right' && result.value === expected
  return behaviorFinding(
    mode,
    {
      code: 'FP-CORE-014',
      label: 'stack-safe trampoline',
      lines: '145-154,260-283',
    },
    valid
      ? []
      : [
          result._tag === 'Left'
            ? result.error.message
            : 'deep Bounce evaluation returned the wrong value',
        ]
  )
}

export const inspectCapabilityBehavior = (runtime, mode) => [
  ...inspectPipe(runtime, mode),
  ...inspectPartial(runtime, mode),
  ...inspectPredicates(runtime, mode),
  ...inspectSequence(runtime, mode),
  ...inspectTrampoline(runtime, mode),
]
