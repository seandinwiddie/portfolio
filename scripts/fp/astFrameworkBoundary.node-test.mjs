import assert from 'node:assert/strict'
import test from 'node:test'

import { collectFpAstFindingsFromSource } from './astConformance.mjs'

const findingsFor = (text) =>
  collectFpAstFindingsFromSource({
    text,
    filePath: 'src/features/systems/audio/audioAdapters.ts',
  })
const classFindings = (text) =>
  findingsFor(text).filter(({ ruleId }) => ruleId === 'FP-AST-001')

test('one documented framework constructor adapter is a narrow exception', () => {
  const findings = classFindings(`
    /** @fp-framework-boundary Web Audio exposes AudioContext only as a constructor. */
    const createAudioContext = (Context: AudioContextConstructor) => new Context();
  `)
  assert.equal(findings.length, 0)
  assert.equal(
    findingsFor(`
    /** @fp-framework-boundary Web Audio requires construction. */
    const createAudioContext = (Context: AudioContextConstructor) => new Context();
  `).find(({ ruleId }) => ruleId === 'FP-AST-010')?.disposition,
    'REVIEW'
  )
})

test('framework constructor exception requires a nonempty reason', () => {
  const findings = classFindings(`
    /** @fp-framework-boundary */
    const createAudioContext = (Context: AudioContextConstructor) => new Context();
  `)
  assert.equal(findings.length, 1)
})

test('framework constructor exception remains thin', () => {
  const findings = classFindings(`
    /** @fp-framework-boundary Web Audio construction. */
    const createAudioContext = (Context: AudioContextConstructor) => {
      auditConstruction();
      return new Context();
    };
  `)
  assert.equal(findings.length, 1)
})

test('framework class returns must directly delegate', () => {
  const iife = classFindings(`
    /** @fp-framework-boundary Framework requires this callback class. */
    class FrameworkAdapter {
      run(value) {
        return (() => { mutate(value); return calculate(value); })();
      }
    }
  `)
  assert.equal(iife.length, 1)
  const objectWork = classFindings(`
    /** @fp-framework-boundary Framework requires this callback class. */
    class FrameworkAdapter { run(value) { return { value: calculate(value) }; } }
  `)
  assert.equal(objectWork.length, 1)
  const computedReceiver = classFindings(`
    /** @fp-framework-boundary Framework requires this callback class. */
    class FrameworkAdapter { run(value) { return createDelegate().run(value); } }
  `)
  assert.equal(computedReceiver.length, 1)
})

test('constructor parameter properties make framework classes stateful', () => {
  const findings = classFindings(`
    /** @fp-framework-boundary Framework requires construction. */
    class FrameworkAdapter {
      constructor(public readonly value: Value) {}
    }
  `)
  assert.equal(findings.length, 1)
})

test('known JavaScript prototype inheritance is blocking', () => {
  const findings = classFindings(`
    Child.prototype = Object.create(Parent.prototype)
    Object.setPrototypeOf(Second.prototype, Parent.prototype)
    util.inherits(Third, Parent)
  `)
  assert.equal(findings.length, 3)
  assert.ok(findings.every(({ disposition }) => disposition === 'BLOCK'))
  assert.deepEqual(classFindings('const dictionary = Object.create(null)'), [])
})

test('unannotated construction remains blocking', () => {
  const [finding] = classFindings(
    'const createAudioContext = (Context: AudioContextConstructor) => new Context();'
  )
  assert.equal(finding?.disposition, 'BLOCK')
  assert.match(finding?.skillRef ?? '', /\/fp\/SKILL\.md:51-53$/)
})

test('accepted trampoline drivers remain visible for contextual review', () => {
  const finding = findingsFor(`
    /** @fp-trampoline-driver */
    const trampoline = (bounce: Bounce) => {
      while (bounce._tag === 'Call') bounce = bounce.next();
      return bounce.value;
    };
  `).find(({ ruleId }) => ruleId === 'FP-AST-010')
  assert.equal(finding?.disposition, 'REVIEW')
  assert.match(finding?.advice ?? '', /Read the complete fp skill/)
})
