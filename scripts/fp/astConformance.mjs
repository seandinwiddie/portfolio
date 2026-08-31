import {
  collectFpControlFindings,
  countAcceptedTrampolineDrivers,
} from './astControlChecks.mjs'
import { collectFpCompositionFindings } from './astCompositionChecks.mjs'
import { collectFpDependencyFindings } from './astDependencyChecks.mjs'
import { collectFpNameFindings } from './astNameChecks.mjs'
import { collectFpReduxStateFindings } from './astReduxStateChecks.mjs'
import { collectFpSignatureFindings } from './astSignatureChecks.mjs'
import { classifyFpSourceScope, dispositionForScope } from './astScope.mjs'
import {
  FP_AST_MARKER_DOCUMENTATION,
  FP_AST_RULES,
  FP_SKILL_GUIDANCE,
  FP_SKILL_PATH,
  FP_SKILL_REVIEW_ADVICE,
  FRAMEWORK_CLASS_MARKER,
  TRAMPOLINE_DRIVER_MARKER,
  formatFpAstFinding,
} from './astRules.mjs'
import {
  isAppRuntimeSourcePath,
  isRuntimeSourcePath,
  parseSource,
  resolveTypescript,
} from './astShared.mjs'

export {
  FP_AST_MARKER_DOCUMENTATION,
  FP_AST_RULES,
  FP_SKILL_GUIDANCE,
  FP_SKILL_PATH,
  FP_SKILL_REVIEW_ADVICE,
  FRAMEWORK_CLASS_MARKER,
  TRAMPOLINE_DRIVER_MARKER,
  formatFpAstFinding,
  isRuntimeSourcePath,
  isAppRuntimeSourcePath,
  classifyFpSourceScope,
  dispositionForScope,
}

const findingKey = (finding) =>
  [finding.ruleId, finding.file, finding.line, finding.column, finding.message].join(':')

export const collectFpAstFindings = (context, unit) => {
  const file = unit.rel ?? unit.filePath
  if (!file) throw new TypeError('FP AST unit requires rel or filePath')
  if (unit.runtime === false || !isAppRuntimeSourcePath(file)) return []
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript) throw new Error('TypeScript parser is required for FP AST checks')
  const sourceFile = parseSource(typescript, unit.filePath ?? file, unit.text)
  const scope = unit.scope ?? classifyFpSourceScope(file)
  const findings = [
    ...collectFpControlFindings(file, typescript, sourceFile, {
      allowTrampolineDriver: unit.allowTrampolineDriver ?? true,
      scope,
    }),
    ...collectFpSignatureFindings(file, typescript, sourceFile, { scope }),
    ...collectFpCompositionFindings(file, typescript, sourceFile, { scope }),
    ...collectFpNameFindings(file, typescript, sourceFile),
    ...collectFpReduxStateFindings(file, typescript, sourceFile),
  ].map((finding) => ({ ...finding, scope }))
  return [
    ...new Map(findings.map((finding) => [findingKey(finding), finding])).values(),
  ].sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.column - right.column ||
      left.ruleId.localeCompare(right.ruleId)
  )
}

export const collectFpAstFindingsForUnits = (context, units) => {
  const typescript = resolveTypescript(context.projectRoot)
  if (!typescript) throw new Error('TypeScript parser is required for FP AST checks')
  const runtimeUnits = units.filter((unit) => {
    const file = unit.rel ?? unit.filePath
    return file && unit.runtime !== false && isAppRuntimeSourcePath(file)
  })
  const driverCount = runtimeUnits.reduce((count, unit) => {
    const file = unit.rel ?? unit.filePath
    const sourceFile = parseSource(typescript, unit.filePath ?? file, unit.text)
    return count + countAcceptedTrampolineDrivers(typescript, sourceFile)
  }, 0)
  const unitFindings = runtimeUnits.flatMap((unit) =>
    collectFpAstFindings(context, {
      ...unit,
      allowTrampolineDriver: driverCount === 1,
    })
  )
  return [...unitFindings, ...collectFpDependencyFindings(runtimeUnits, typescript)]
}

export const collectFpAstFindingsFromSource = ({
  text,
  filePath = 'src/fpAstFixture.ts',
  projectRoot = process.cwd(),
  runtime = true,
  scope,
}) =>
  collectFpAstFindings({ projectRoot }, { filePath, rel: filePath, text, runtime, scope })
