import path from 'node:path'
import {
  allowedViewFeatureRoles,
  forbiddenTargetRoles,
  importRegex,
  ownedFactoryPatterns,
  roleLeafStem,
  roleForSpecifier,
  viewLogicPatterns,
  viewPatterns,
} from './roleRules.mjs'
import {
  collectSkillFindings,
  collectViewTypeFindings,
  collectIndexBarrelFindings,
} from './skillChecks.mjs'
import { collectSkillAstFindings } from './skillAstChecks.mjs'
import { collectRoleNameFindings } from './roleNames.mjs'
import { collectBehaviorFindings, collectPurityFindings } from './behaviorChecks.mjs'

export { collectBehaviorFindings, collectPurityFindings }

const viewsPathSegmentPattern = /(^|\/)views(\/|$)/i
const ownedSourcePathSegmentPattern =
  /(^|\/)(?:features|components|entities|systems)(\/|$)/i

// Every .tsx file is a presentational view: tsx holds only markup and pulls all
// logic from the feature layer (selectors/actions, and — at the app composition
// root — the orchestration thunk hooks). Files under app/ are that root: they may
// bind the orchestration hooks, and the layout binds the store Provider.
const isTsxFile = (filePath) => /\.tsx$/i.test(filePath)
const normalizedSourcePath = (rel) => rel.split('\\').join('/')
const isTopLevelRouteView = (normalized) =>
  /^src\/views\/(?!registry\/|aperture\/|bridge\/)[^/]+\/[^/]+View\.tsx$/i.test(
    normalized
  )
const isAppFile = (rel) => {
  const normalized = normalizedSourcePath(rel)
  return normalized.startsWith('app/') || isTopLevelRouteView(normalized)
}
const isAppLayoutFile = (rel) => {
  const normalized = normalizedSourcePath(rel)
  return (
    /(^|\/)_layout\.[jt]sx$/i.test(normalized) ||
    normalized === 'src/views/layout/layoutView.tsx'
  )
}
const bareRoleLeafNames = new Set([
  'action',
  'actions',
  'adapter',
  'adapters',
  'listener',
  'listeners',
  'middleware',
  'reducer',
  'reducers',
  'selector',
  'selectors',
  'slice',
  'thunk',
  'thunks',
  'type',
  'types',
  'view',
  'api',
])

const isAppRootSourceFile = (context, filePath) =>
  path.resolve(path.dirname(filePath)) === path.resolve(context.srcRoot)

const importPointsToViews = (context, specifier, target) =>
  viewsPathSegmentPattern.test(specifier.split('\\').join('/')) ||
  (target ? context.roleForFile(target) === 'view' : false)

const importPointsToOwnedSource = (context, specifier, target) =>
  ownedSourcePathSegmentPattern.test(specifier.split('\\').join('/')) ||
  (target
    ? ownedSourcePathSegmentPattern.test(`/${context.relativeToProject(target)}`)
    : false)

const importPointsToStore = (context, specifier, target) => {
  const normalized = specifier.split('\\').join('/')
  const targetRel = target ? `/${context.relativeToProject(target)}` : ''
  return (
    /(^|\/)store(\.[a-z0-9]+)?$/i.test(normalized) ||
    /\/store\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/i.test(targetRel)
  )
}

const isFeatureFile = (context, filePath) =>
  ownedSourcePathSegmentPattern.test(`/${context.relativeToProject(filePath)}`)

const isRootStoreFile = (context, filePath) =>
  isAppRootSourceFile(context, filePath) &&
  path.basename(filePath).toLowerCase().startsWith('store.')

export const isRtkBoundaryFile = (context, filePath) =>
  isFeatureFile(context, filePath) || isRootStoreFile(context, filePath)

const collectRootFindings = (context) => {
  const findings = []
  for (const filePath of context.sourceFiles) {
    if (!isAppRootSourceFile(context, filePath)) continue
    const rootStem = roleLeafStem(filePath).toLowerCase()
    if (rootStem === 'index' || rootStem === 'store') continue

    const rel = context.relativeToProject(filePath)
    const text = context.readText(filePath)
    findings.push(
      `${rel}:1: app-root source file must be index or store; move implementation into an ECS ownership domain`
    )
    const declaredRole = context.roleForFile(filePath)
    if (declaredRole) {
      findings.push(
        `${rel}:1: root source file declares ${declaredRole} role; app root files may only export or wire the public surface, while role files must live under ECS ownership domains or views`
      )
    }
    for (const [ownerRole, pattern] of Object.entries(ownedFactoryPatterns)) {
      const match = pattern.exec(text)
      if (match) {
        findings.push(
          `${rel}:${context.lineNumber(text, match.index)}: root source file assembles ${ownerRole} factory; role factories must live under an ECS ownership domain`
        )
      }
    }
  }
  return findings
}

const collectFactoryFindings = (context, unit) =>
  Object.entries(ownedFactoryPatterns).flatMap(([ownerRole, pattern]) => {
    if (ownerRole === unit.role || (ownerRole === 'selectors' && unit.role === 'slice'))
      return []
    const match = pattern.exec(unit.text)
    return match
      ? [
          `${unit.rel}:${context.lineNumber(unit.text, match.index)}: ${unit.role} file assembles ${ownerRole} factory`,
        ]
      : []
  })

export const collectViewFindings = (context, unit) => {
  if (unit.role !== 'view') return []
  const findings = collectViewTypeFindings(context, unit)
  const checks = [
    [viewPatterns.storeAccess, 'accesses the store directly'],
    [viewPatterns.asyncWorkflow, 'creates an RTK async/listener workflow'],
    [viewPatterns.cachePatch, 'patches RTK Query cache'],
    [viewPatterns.boundaryIo, 'performs file/command-line/network IO'],
  ]
  for (const [pattern, summary] of checks) {
    for (const match of unit.text.matchAll(pattern)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: view ${summary}`
      )
    }
  }
  for (const [pattern, summary] of viewLogicPatterns) {
    for (const match of unit.text.matchAll(pattern)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: view ${summary}; move calculations/domain decisions into feature selectors/actions`
      )
    }
  }
  return findings
}

export const collectImportFindings = (context, roleByFile, unit) => {
  const findings = []
  for (const match of unit.text.matchAll(importRegex)) {
    const specifier = match[1] ?? match[2] ?? match[3]
    const target = context.resolveRelativeImport(unit.filePath, specifier)
    const targetRole = target
      ? (roleByFile.get(target)?.role ?? context.roleForFile(target))
      : roleForSpecifier(specifier)
    const location = `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}`
    if (unit.role !== 'view' && importPointsToViews(context, specifier, target)) {
      findings.push(`${location}: feature imports views (${specifier})`)
    }
    if (
      unit.role === 'view' &&
      importPointsToStore(context, specifier, target) &&
      !unit.layout
    ) {
      findings.push(`${location}: view imports the store (${specifier})`)
    }
    if (
      unit.role === 'view' &&
      importPointsToOwnedSource(context, specifier, target) &&
      targetRole &&
      !allowedViewFeatureRoles.has(targetRole) &&
      !(unit.app && targetRole === 'thunks')
    ) {
      findings.push(
        `${location}: view imports a feature ${targetRole} role (${specifier})`
      )
    }
    if (targetRole && forbiddenTargetRoles[unit.role]?.has(targetRole)) {
      findings.push(
        `${location}: ${unit.role} must not import ${targetRole} (${specifier})`
      )
    }
  }
  return findings
}

const collectUnitFindings = (context, roleByFile, unit) => {
  const findings = []
  if (!unit.role)
    return [
      `${unit.rel}:1: feature/view file does not declare a recognizable RTK role suffix`,
    ]
  const stem = roleLeafStem(unit.filePath).toLowerCase()
  if (unit.role === 'view' && !stem.endsWith('view') && !unit.app) {
    findings.push(
      `${unit.rel}:1: view source leaf must be folder-qualified and end with View`
    )
  }
  if (bareRoleLeafNames.has(stem)) {
    findings.push(
      `${unit.rel}:1: role source leaf must be domain-qualified, not a bare ${unit.role} role`
    )
  }
  findings.push(...collectFactoryFindings(context, unit))
  findings.push(...collectBehaviorFindings(context, unit))
  findings.push(...collectViewFindings(context, unit))
  findings.push(...collectSkillFindings(context, unit))
  findings.push(...collectSkillAstFindings(context, unit))
  findings.push(...collectImportFindings(context, roleByFile, unit))
  return findings
}

export const checkRoleBoundaries = (context, fail) => {
  const roleFiles = context.sourceFiles.flatMap((filePath) => {
    const rel = context.relativeToProject(filePath)
    const relative = `/${rel}`
    const tsx = isTsxFile(filePath)
    if (
      !ownedSourcePathSegmentPattern.test(relative) &&
      !relative.includes('/views/') &&
      !tsx
    )
      return []
    return [
      {
        filePath,
        rel,
        role: tsx ? 'view' : context.roleForFile(filePath),
        app: isAppFile(rel),
        layout: isAppLayoutFile(rel),
        text: context.readText(filePath),
      },
    ]
  })
  const roleByFile = new Map(roleFiles.map((unit) => [unit.filePath, unit]))
  const findings = [
    ...collectRootFindings(context),
    ...collectIndexBarrelFindings(context),
    ...collectRoleNameFindings(context, roleFiles),
    ...roleFiles.flatMap((unit) => collectUnitFindings(context, roleByFile, unit)),
    ...roleFiles.flatMap((unit) => collectPurityFindings(context, unit)),
  ]
  if (findings.length) fail('RTK role boundary findings:', findings)
  else
    console.log(
      '[ok] RTK role boundaries match app ownership; state stays in the Redux store and reactive workflows stay in listener middleware'
    )
}
