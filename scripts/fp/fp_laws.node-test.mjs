import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ebind,
  efmap,
  ematch,
  fmap,
  just,
  left,
  match,
  mbind,
  nothing,
  right,
  traverse,
} from 'functional-programming-composition'

const maybeValue = (value) =>
  match(
    value,
    (present) => ({ tag: 'Just', value: present }),
    () => ({ tag: 'Nothing' })
  )

const eitherValue = (value) =>
  ematch(
    value,
    (error) => ({ tag: 'Left', error }),
    (present) => ({ tag: 'Right', value: present })
  )

const absent = () => (typeof nothing === 'function' ? nothing() : nothing)
const maybeSamples = [just(3), absent()]
const eitherSamples = [right(3), left('unavailable')]
const increment = (value) => value + 1
const double = (value) => value * 2
const maybeIncrement = (value) => just(increment(value))
const maybeDouble = (value) => just(double(value))
const eitherIncrement = (value) => right(increment(value))
const eitherDouble = (value) => right(double(value))

test('Maybe Functor obeys identity', () => {
  maybeSamples.forEach((sample) => {
    assert.deepEqual(maybeValue(fmap(sample, (value) => value)), maybeValue(sample))
  })
})

test('Maybe Functor obeys composition', () => {
  maybeSamples.forEach((sample) => {
    const sequential = fmap(fmap(sample, increment), double)
    const composed = fmap(sample, (value) => double(increment(value)))
    assert.deepEqual(maybeValue(sequential), maybeValue(composed))
  })
})

test('Maybe Monad obeys left and right identity', () => {
  assert.deepEqual(
    maybeValue(mbind(just(3), maybeIncrement)),
    maybeValue(maybeIncrement(3))
  )
  maybeSamples.forEach((sample) => {
    assert.deepEqual(maybeValue(mbind(sample, just)), maybeValue(sample))
  })
})

test('Maybe Monad obeys associativity', () => {
  maybeSamples.forEach((sample) => {
    const groupedLeft = mbind(mbind(sample, maybeIncrement), maybeDouble)
    const groupedRight = mbind(sample, (value) =>
      mbind(maybeIncrement(value), maybeDouble)
    )
    assert.deepEqual(maybeValue(groupedLeft), maybeValue(groupedRight))
  })
})

test('Either Functor obeys identity', () => {
  eitherSamples.forEach((sample) => {
    assert.deepEqual(eitherValue(efmap(sample, (value) => value)), eitherValue(sample))
  })
})

test('Either Functor obeys composition', () => {
  eitherSamples.forEach((sample) => {
    const sequential = efmap(efmap(sample, increment), double)
    const composed = efmap(sample, (value) => double(increment(value)))
    assert.deepEqual(eitherValue(sequential), eitherValue(composed))
  })
})

test('Either Monad obeys left and right identity', () => {
  assert.deepEqual(
    eitherValue(ebind(right(3), eitherIncrement)),
    eitherValue(eitherIncrement(3))
  )
  eitherSamples.forEach((sample) => {
    assert.deepEqual(eitherValue(ebind(sample, right)), eitherValue(sample))
  })
})

test('Either Monad obeys associativity', () => {
  eitherSamples.forEach((sample) => {
    const groupedLeft = ebind(ebind(sample, eitherIncrement), eitherDouble)
    const groupedRight = ebind(sample, (value) =>
      ebind(eitherIncrement(value), eitherDouble)
    )
    assert.deepEqual(eitherValue(groupedLeft), eitherValue(groupedRight))
  })
})

test('Traversable flips an Array of present values into one Maybe Array', () => {
  assert.deepEqual(maybeValue(traverse([1, 2, 3], (value) => just(double(value)))), {
    tag: 'Just',
    value: [2, 4, 6],
  })
})

test('Traversable preserves Nothing when any element is absent', () => {
  assert.deepEqual(
    maybeValue(traverse([1, 2, 3], (value) => (value === 2 ? absent() : just(value)))),
    { tag: 'Nothing' }
  )
})
