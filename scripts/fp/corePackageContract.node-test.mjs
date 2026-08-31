import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { CORE_PACKAGE } from './corePackageShared.mjs'
import { inspectCorePackage } from './corePackageContract.mjs'
import { makeCoreProject, valueExports } from './corePackageContractFixtures.mjs'
const checkerPath = fileURLToPath(new URL('./corePackageContract.mjs', import.meta.url))
const fixture = async (context, options = {}) => {
  const root = await makeCoreProject(options)
  context.after(() => rm(root, { recursive: true, force: true }))
  return root
}
const codesOf = (findings) => findings.map(({ code }) => code)
const expectCode = (findings, code) => {
  const finding = findings.find((current) => current.code === code)
  assert.ok(
    finding,
    `Expected ${code}; received ${codesOf(findings).join(', ') || 'none'}`
  )
  assert.equal(finding.severity, 'BLOCKING')
  if (['FP-CORE-003', 'FP-CORE-004', 'FP-CORE-016'].includes(code)) {
    assert.match(finding.engineeringReference, /Package engineering/)
    assert.equal(finding.skillReference, undefined)
  } else {
    assert.match(finding.skillReference, /\/fp\/SKILL\.md:\d/)
  }
  return finding
}
const without = (name) => valueExports.filter((current) => current !== name)
test('good dependency, surfaces, data, capabilities, and Validation pass', async (context) => {
  const root = await fixture(context)
  assert.deepEqual(await inspectCorePackage(root), [])
})
test('the optional CLI project root is honored', async (context) => {
  const root = await fixture(context)
  const result = spawnSync(process.execPath, [checkerPath, root], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /FP core package contract passed/)
})
test('a core package project resolves itself without depending on itself', async (context) => {
  const root = await fixture(context, { selfCore: true })
  assert.deepEqual(await inspectCorePackage(root), [])
})
test('manifest text does not substitute for an actual dependency field', async (context) => {
  const root = await fixture(context, {
    projectManifest: {
      dependencies: {},
      description: `A mention of ${CORE_PACKAGE} is not a dependency`,
    },
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-001')
})
test('a declared but uninstalled core reports resolution failure', async (context) => {
  const root = await fixture(context, { installCore: false })
  expectCode(await inspectCorePackage(root), 'FP-CORE-002')
})
test('ESM runtime exports are compared with declared value exports', async (context) => {
  const root = await fixture(context, { esmNames: without('right') })
  expectCode(await inspectCorePackage(root), 'FP-CORE-003')
})
test('CJS runtime exports are compared with declared value exports', async (context) => {
  const root = await fixture(context, { cjsNames: without('left') })
  expectCode(await inspectCorePackage(root), 'FP-CORE-004')
})
test('undeclared runtime values also fail the surface comparison', async (context) => {
  const root = await fixture(context, {
    declarationNames: without('empty'),
  })
  const findings = await inspectCorePackage(root)
  expectCode(findings, 'FP-CORE-003')
  expectCode(findings, 'FP-CORE-004')
})
;['dependencies', 'peerDependencies', 'optionalDependencies'].forEach((field) =>
  test(`the installed core must have zero ${field}`, async (context) => {
    const root = await fixture(context, {
      coreManifest: { [field]: { impure_layer: '1.0.0' } },
    })
    expectCode(await inspectCorePackage(root), 'FP-CORE-005')
  })
)
test('undeclared built-in imports still violate core independence', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) => `import 'node:fs'\n${source}`,
    mutateCjs: (source) => `require('node:path')\n${source}`,
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-017')
})
test('lexically local ESM require calls are not module edges', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) =>
      `const require = (value) => value\nrequire('local-value')\n${source}`,
  })
  assert.deepEqual(await inspectCorePackage(root), [])
})
test('module.require remains a CJS dependency edge', async (context) => {
  const root = await fixture(context, {
    mutateCjs: (source) => `module.require('node:fs')\n${source}`,
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-017')
})
test('malformed inline source maps fall back without throwing', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) => `${source}\n//# sourceMappingURL=data:application/json,%ZZ\n`,
  })
  assert.deepEqual(await inspectCorePackage(root), [])
})
test('a hidden class in a resolved entry violates the source contract', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) => `class HiddenCore {}\n${source}`,
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-019')
})
test('Math.random in a resolved entry violates core effect isolation', async (context) => {
  const root = await fixture(context, {
    mutateCjs: (source) =>
      `const localOnly = (Math) => Math.random\nconst hiddenSeed = Math.random()\n${source}`,
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-020')
})
test('a lexically local Math capability remains clean', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) => `const localOnly = (Math) => Math.random()\n${source}`,
  })
  assert.deepEqual(await inspectCorePackage(root), [])
})
test('recursive ESM auxiliary imports expose external dependencies', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) => `import './aux.js'\n${source}`,
    auxiliaryFiles: {
      'dist/aux.js': "import './nested.js'\n",
      'dist/nested.js': "import 'node:fs'\n",
    },
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-017')
})
test('recursive CJS auxiliary modules receive AST and effect scans', async (context) => {
  const root = await fixture(context, {
    mutateCjs: (source) => `require('./aux.cjs')\n${source}`,
    auxiliaryFiles: {
      'dist/aux.cjs': "require('./nested.cjs')\n",
      'dist/nested.cjs': 'class HiddenAux {}\nconst seed = Math.random()\n',
    },
  })
  const findings = await inspectCorePackage(root)
  expectCode(findings, 'FP-CORE-019')
  expectCode(findings, 'FP-CORE-020')
})
const richConstructorCases = [
  [
    'just',
    "const just = (value) => ({ _tag: 'Just', value })",
    "const just = (value) => ({ _tag: 'Just', value, map: (fn) => just(fn(value)) })",
  ],
  [
    'nothing',
    "const nothing = { _tag: 'Nothing' }",
    "const nothing = { _tag: 'Nothing', map: () => nothing }",
  ],
  [
    'left',
    "const left = (left) => ({ _tag: 'Left', left })",
    "const left = (left) => ({ _tag: 'Left', left, match: (fn) => fn(left) })",
  ],
  [
    'right',
    "const right = (right) => ({ _tag: 'Right', right })",
    "const right = (right) => ({ _tag: 'Right', right, chain: (fn) => fn(right) })",
  ],
]
richConstructorCases.forEach(([name, original, replacement]) =>
  test(`${name} rejects method-rich closure data`, async (context) => {
    const root = await fixture(context, {
      mutateEsm: (source) => source.replace(original, replacement),
    })
    expectCode(await inspectCorePackage(root), 'FP-CORE-006')
  })
)
const payloadCases = [
  ['just', 'value', 'Just'],
  ['left', 'left', 'Left'],
  ['right', 'right', 'Right'],
]
payloadCases.forEach(([name, key, tag]) =>
  test(`${name} retains its ${key} payload through JSON`, async (context) => {
    const original = `const ${name} = (${key}) => ({ _tag: '${tag}', ${key} })`
    const replacement = `const ${name} = (${key}) => ({ _tag: '${tag}', ${key}: { marker: 'lost', count: -1 } })`
    const root = await fixture(context, {
      mutateCjs: (source) => source.replace(original, replacement),
    })
    expectCode(await inspectCorePackage(root), 'FP-CORE-007')
  })
)
const capabilityCases = [
  ['pipe', 'FP-CORE-010'],
  ['partial', 'FP-CORE-011'],
  ['both', 'FP-CORE-012'],
  ['sequence', 'FP-CORE-013'],
  ['trampoline', 'FP-CORE-014'],
  ['concat', 'FP-CORE-015'],
  ['ap', 'FP-CORE-008'],
]
capabilityCases.forEach(([name, code]) =>
  test(`missing ${name} capability reports ${code}`, async (context) => {
    const names = without(name)
    const root = await fixture(context, {
      esmNames: names,
      cjsNames: names,
      declarationNames: names,
    })
    expectCode(await inspectCorePackage(root), code)
  })
)
test('Validation requires Success.value and Failure.errors tagged shapes', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) =>
      source
        .replace(
          "const success = (value) => ({ _tag: 'Success', value })",
          "const success = (value) => ({ _tag: 'Success', result: value })"
        )
        .replace(
          "const failure = (...errors) => ({ _tag: 'Failure', errors })",
          "const failure = (...errors) => ({ _tag: 'Failure', failures: errors })"
        ),
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-009')
})
test('Validation values must not expose chain', async (context) => {
  const root = await fixture(context, {
    mutateCjs: (source) =>
      source.replace(
        "const success = (value) => ({ _tag: 'Success', value })",
        "const success = (value) => ({ _tag: 'Success', value, chain: (fn) => fn(value) })"
      ),
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-009')
})
test('Validation ap accumulates two independent failures', async (context) => {
  const root = await fixture(context, {
    mutateEsm: (source) => source.replace(': failure(...errorsOf(vf, va))', ': vf'),
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-009')
})
test('Monoid concat and empty obey identity and associativity laws', async (context) => {
  const root = await fixture(context, {
    mutateCjs: (source) =>
      source.replace(
        'const concat = (leftValue, rightValue) => leftValue.concat(rightValue)',
        'const concat = (leftValue, rightValue) => leftValue'
      ),
  })
  expectCode(await inspectCorePackage(root), 'FP-CORE-018')
})
const behaviorCases = [
  [
    'pipe',
    'FP-CORE-010',
    'mutateEsm',
    'transforms.reduce((current, transform) => transform(current), value)',
    'transforms.reduceRight((current, transform) => transform(current), value)',
  ],
  [
    'partial',
    'FP-CORE-011',
    'mutateCjs',
    'operation(...captured, ...remaining)',
    'operation(...remaining, ...captured)',
  ],
  [
    'predicates',
    'FP-CORE-012',
    'mutateEsm',
    'leftPredicate(value) && rightPredicate(value)',
    'leftPredicate(value) || rightPredicate(value)',
  ],
  [
    'sequence',
    'FP-CORE-013',
    'mutateCjs',
    "collected._tag === 'Nothing' || current._tag === 'Nothing'",
    "collected._tag === 'Never' || current._tag === 'Never'",
  ],
  [
    'trampoline',
    'FP-CORE-014',
    'mutateEsm',
    "const trampoline = (bounce) => {\n  let current = bounce\n  while (current._tag === 'Call') current = current.next()\n  return current.value\n}",
    "const trampoline = (bounce) => bounce._tag === 'Call' ? trampoline(bounce.next()) : bounce.value",
  ],
]
behaviorCases.forEach(([label, code, mode, original, replacement]) =>
  test(`${label} requires correct runtime behavior`, async (context) => {
    const root = await fixture(context, {
      [mode]: (source) => source.replace(original, replacement),
    })
    expectCode(await inspectCorePackage(root), code)
  })
)
test('generated CJS helper control and untyped arity remain review-only', async (context) => {
  const root = await fixture(context, {
    mutateCjs: (source) =>
      `const __copyProps = (to, from, except, desc) => { for (const key in from) to[key] = from[key]; return to }\n${source}`,
  })
  const findings = (await inspectCorePackage(root)).filter(
    ({ code }) => code === 'FP-CORE-019'
  )
  assert.ok(findings.length >= 2)
  assert.ok(findings.every(({ severity }) => severity === 'REVIEW'))
  assert.equal(
    spawnSync(process.execPath, [checkerPath, root], { encoding: 'utf8' }).status,
    0
  )
})
const declarationCases = [
  ['Maybe', 'mutateEsmDeclaration', 'readonly value: T', 'readonly value: string'],
  [
    'Either',
    'mutateCjsDeclaration',
    "readonly _tag: 'Left'",
    "readonly _tag: 'WrongLeft'",
  ],
  [
    'Validation',
    'mutateEsmDeclaration',
    'readonly errors: readonly E[]',
    'errors: readonly E[]',
  ],
  [
    'constructor',
    'mutateCjsDeclaration',
    'just: <T>(value: T) => Maybe<T>',
    'just: <T>(value: T) => Maybe<never>',
  ],
]
declarationCases.forEach(([label, mode, original, replacement]) =>
  test(`${label} declaration shape is enforced`, async (context) => {
    const root = await fixture(context, {
      [mode]: (source) => source.replace(original, replacement),
    })
    expectCode(await inspectCorePackage(root), 'FP-CORE-021')
  })
)
