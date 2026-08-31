#!/usr/bin/env node

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  blocking,
  compareSurface,
  dependencyFieldFindings,
  inspectProjectDependency,
  engineering,
  loadCoreSurfaces,
  readJson,
  resolveInstalledCore,
} from './corePackageShared.mjs'
import { inspectRuntimeData } from './corePackageDataContract.mjs'
import { inspectRuntimeImports } from './corePackageIndependence.mjs'
import { inspectCoreSources } from './corePackageSourceContract.mjs'
import { loadCoreModuleGraph } from './corePackageModuleGraph.mjs'
import { inspectCapabilityBehavior } from './corePackageBehaviorContract.mjs'
import { inspectCoreDeclarations } from './corePackageDeclarationContract.mjs'
import {
  inspectCapabilities,
  inspectMonoid,
  inspectValidation,
} from './corePackageCapabilities.mjs'

const capture = (operation) =>
  Promise.resolve()
    .then(operation)
    .then(
      (value) => ({ _tag: 'Right', value }),
      (error) => ({ _tag: 'Left', error })
    )

const projectManifestResult = async (projectRoot) =>
  capture(() => readJson(resolve(projectRoot, 'package.json')))

const inspectInstalled = async (projectRoot) =>
  capture(() => resolveInstalledCore(projectRoot))

const manifestFailure = (error) =>
  blocking(
    'FP-CORE-000',
    `Could not parse the project package.json dependency fields: ${error.message}`,
    '64-65'
  )

const resolutionFailure = (error) =>
  blocking(
    'FP-CORE-002',
    `Could not resolve the installed functional-programming-composition package from the project root: ${error.message}`,
    '64-65'
  )

const surfaceFailure = (error) =>
  engineering(
    'FP-CORE-016',
    `Could not load the installed core's declarations and ESM/CJS entry points: ${error.message}`
  )

const inspectLoadedSurfaces = async (loaded, projectRoot) => {
  const graph = await loadCoreModuleGraph(
    loaded.paths,
    loaded.packageDirectory,
    projectRoot
  )
  const runtimeFindings = await Promise.all([
    inspectRuntimeData(loaded.runtimes.esm, 'ESM'),
    inspectRuntimeData(loaded.runtimes.cjs, 'CJS'),
    inspectValidation(loaded.runtimes.esm, 'ESM'),
    inspectValidation(loaded.runtimes.cjs, 'CJS'),
    inspectMonoid(loaded.runtimes.esm, 'ESM'),
    inspectMonoid(loaded.runtimes.cjs, 'CJS'),
    inspectCapabilityBehavior(loaded.runtimes.esm, 'ESM'),
    inspectCapabilityBehavior(loaded.runtimes.cjs, 'CJS'),
    inspectCoreDeclarations(loaded.paths),
    inspectRuntimeImports(graph),
    inspectCoreSources(graph, projectRoot),
  ])

  return [
    ...compareSurface(loaded.esm, 'ESM'),
    ...compareSurface(loaded.cjs, 'CJS'),
    ...inspectCapabilities(loaded),
    ...runtimeFindings.flat(),
  ]
}

export const inspectCorePackage = async (root = process.cwd()) => {
  const projectRoot = resolve(root)
  const project = await projectManifestResult(projectRoot)

  return project._tag === 'Left'
    ? [manifestFailure(project.error)]
    : inspectInstalled(projectRoot).then(async (installed) => {
        const declarationFindings = inspectProjectDependency(project.value)

        return installed._tag === 'Left'
          ? [...declarationFindings, resolutionFailure(installed.error)]
          : capture(() => loadCoreSurfaces(installed.value)).then(async (loaded) => [
              ...declarationFindings,
              ...dependencyFieldFindings(installed.value.manifest),
              ...(loaded._tag === 'Left'
                ? [surfaceFailure(loaded.error)]
                : await inspectLoadedSurfaces(loaded.value, projectRoot)),
            ])
      })
}

export const formatFinding = (finding) => {
  const reference = finding.skillReference
    ? `Skill: ${finding.skillReference}`
    : `Contract: ${finding.engineeringReference}`
  return `[${finding.severity}] ${finding.code} ${finding.message}\n  ${reference}\n  Advice: ${finding.advice}`
}

export const runCli = async (root = process.cwd()) => {
  const findings = await inspectCorePackage(root)
  const blockers = findings.filter(({ severity }) => severity === 'BLOCKING')
  const output =
    findings.length === 0
      ? 'FP core package contract passed.'
      : [
          blockers.length === 0
            ? 'FP core package contract passed with review findings.'
            : null,
          ...findings.map(formatFinding),
        ]
          .filter(Boolean)
          .join('\n')

  console.log(output)
  process.exitCode = blockers.length === 0 ? 0 : 1
  return findings
}

const invokedPath = process.argv[1]
const invokedDirectly =
  typeof invokedPath === 'string' &&
  import.meta.url === pathToFileURL(resolve(invokedPath)).href

invokedDirectly && (await runCli(process.argv[2] ?? process.cwd()))
