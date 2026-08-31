import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { CORE_PACKAGE } from './corePackageShared.mjs'

export const valueExports = Object.freeze([
  'just',
  'nothing',
  'left',
  'right',
  'success',
  'failure',
  'ap',
  'pipe',
  'partial',
  'both',
  'either',
  'allPass',
  'complement',
  'sequence',
  'trampoline',
  'concat',
  'empty',
])

const implementation = `
const just = (value) => ({ _tag: 'Just', value })
const nothing = { _tag: 'Nothing' }
const left = (left) => ({ _tag: 'Left', left })
const right = (right) => ({ _tag: 'Right', right })
const success = (value) => ({ _tag: 'Success', value })
const failure = (...errors) => ({ _tag: 'Failure', errors })
const errorsOf = (...values) => values.flatMap((value) =>
  value._tag === 'Failure' ? value.errors : []
)
const ap = (vf, va) =>
  vf._tag === 'Success' && va._tag === 'Success'
    ? success(vf.value(va.value))
    : failure(...errorsOf(vf, va))
const pipe = (value, ...transforms) =>
  transforms.reduce((current, transform) => transform(current), value)
const partial = (operation, ...captured) =>
  (...remaining) => operation(...captured, ...remaining)
const both = (leftPredicate, rightPredicate) =>
  (value) => leftPredicate(value) && rightPredicate(value)
const either = (leftPredicate, rightPredicate) =>
  (value) => leftPredicate(value) || rightPredicate(value)
const allPass = (predicates) =>
  (value) => predicates.every((predicate) => predicate(value))
const complement = (predicate) => (value) => !predicate(value)
const sequence = (values) => values.reduce(
  (collected, current) =>
    collected._tag === 'Nothing' || current._tag === 'Nothing'
      ? nothing
      : just([...collected.value, current.value]),
  just([]),
)
/** @fp-trampoline-driver */
const trampoline = (bounce) => {
  let current = bounce
  while (current._tag === 'Call') current = current.next()
  return current.value
}
const concat = (leftValue, rightValue) => leftValue.concat(rightValue)
const empty = []
`.trim()

const typedDeclarations = Object.freeze({
  just: 'export declare const just: <T>(value: T) => Maybe<T>',
  nothing: 'export declare const nothing: Maybe<never>',
  left: 'export declare const left: <E>(left: E) => Either<E, never>',
  right: 'export declare const right: <T>(right: T) => Either<never, T>',
  success: 'export declare const success: <T>(value: T) => Validation<never, T>',
  failure: 'export declare const failure: <E>(...errors: E[]) => Validation<E, never>',
  ap: 'export declare const ap: <E, A, B>(vf: Validation<E, (value: A) => B>, va: Validation<E, A>) => Validation<E, B>',
})

const declarationSource = (names) =>
  `
export type Maybe<T> =
  | { readonly _tag: 'Just'; readonly value: T }
  | { readonly _tag: 'Nothing' }
export type Either<E, T> =
  | { readonly _tag: 'Left'; readonly left: E }
  | { readonly _tag: 'Right'; readonly right: T }
export type Validation<E, T> =
  | { readonly _tag: 'Failure'; readonly errors: readonly E[] }
  | { readonly _tag: 'Success'; readonly value: T }
${names.map((name) => typedDeclarations[name] ?? `export declare const ${name}: any`).join('\n')}
`.trim()

const moduleSource = (format, names, mutate) => {
  const suffix =
    format === 'esm'
      ? `export { ${names.join(', ')} }`
      : `module.exports = { ${names.join(', ')} }`
  const source = `${implementation}\n${suffix}\n`
  return typeof mutate === 'function' ? mutate(source) : source
}

const defaultProjectManifest = Object.freeze({
  name: 'fp-contract-fixture',
  private: true,
  dependencies: { [CORE_PACKAGE]: '1.0.0' },
})

const defaultCoreManifest = Object.freeze({
  name: CORE_PACKAGE,
  version: '1.0.0',
  type: 'module',
  exports: {
    '.': {
      import: { types: './dist/index.d.ts', default: './dist/index.js' },
      require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
    },
  },
  devDependencies: { 'synthetic-build-tool': '1.0.0' },
})

const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')

const writeSyntheticCore = async (packageDirectory, options) => {
  const dist = join(packageDirectory, 'dist')
  const esmNames = options.esmNames ?? valueExports
  const cjsNames = options.cjsNames ?? valueExports
  const declarationNames = options.declarationNames ?? valueExports
  const declarations = declarationSource(declarationNames)
  await mkdir(dist, { recursive: true })
  await Promise.all([
    writeJson(join(packageDirectory, 'package.json'), {
      ...defaultCoreManifest,
      ...options.coreManifest,
    }),
    writeFile(
      join(dist, 'index.js'),
      moduleSource('esm', esmNames, options.mutateEsm),
      'utf8'
    ),
    writeFile(
      join(dist, 'index.cjs'),
      moduleSource('cjs', cjsNames, options.mutateCjs),
      'utf8'
    ),
    writeFile(
      join(dist, 'index.d.ts'),
      typeof options.mutateEsmDeclaration === 'function'
        ? options.mutateEsmDeclaration(declarations)
        : declarations,
      'utf8'
    ),
    writeFile(
      join(dist, 'index.d.cts'),
      typeof options.mutateCjsDeclaration === 'function'
        ? options.mutateCjsDeclaration(declarations)
        : declarations,
      'utf8'
    ),
    ...Object.entries(options.auxiliaryFiles ?? {}).map(async ([path, source]) => {
      const target = join(packageDirectory, path)
      await mkdir(dirname(target), { recursive: true })
      return writeFile(target, source, 'utf8')
    }),
  ])
}

export const makeCoreProject = async (options = {}) => {
  const root = await mkdtemp(join(tmpdir(), 'therapy11-fp-core-'))
  await mkdir(join(root, 'node_modules'), { recursive: true })
  await (options.selfCore === true
    ? writeSyntheticCore(root, options)
    : Promise.all([
        writeJson(join(root, 'package.json'), {
          ...defaultProjectManifest,
          ...options.projectManifest,
        }),
        options.installCore === false
          ? Promise.resolve()
          : writeSyntheticCore(join(root, 'node_modules', CORE_PACKAGE), options),
      ]))
  return root
}
