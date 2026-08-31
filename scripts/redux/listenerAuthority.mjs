import {
  nodeName,
  parseSource,
  propertyNamed,
  resolveTypescript,
  walkNodes,
} from './typescriptAst.mjs'
import { skillDirectoryOf } from '../skill-paths.mjs'

const skillRoot = skillDirectoryOf('orchestrate-side-effects-handle-side-effects')
const listenerCalls = ['startAppListening', 'startListening']
const gameplayTurnAction = 'gameplayActions.actionCommitted'
const aiTurnAction = 'aiActions.turnRequested'
const combatDefeatAction = 'combatActions.npcDefeated'

const callName = (typescript, node) => {
  if (!typescript.isCallExpression(node)) return ''
  if (typescript.isIdentifier(node.expression)) return node.expression.text
  return typescript.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : ''
}

const unwrap = (typescript, node) => {
  let current = node
  while (
    current &&
    (typescript.isParenthesizedExpression(current) ||
      typescript.isAsExpression(current) ||
      typescript.isTypeAssertionExpression(current) ||
      (typescript.isSatisfiesExpression?.(current) ?? false))
  )
    current = current.expression
  return current
}

const propertyValue = (typescript, property) => {
  if (!property) return null
  if (typescript.isPropertyAssignment(property))
    return unwrap(typescript, property.initializer)
  if (typescript.isMethodDeclaration(property)) return property
  return null
}

const effectSignals = (typescript, effect) => {
  const signals = { dispatches: false, readsLiveState: false }
  if (!effect) return signals
  walkNodes(typescript, effect, (node) => {
    const name = callName(typescript, node)
    signals.dispatches ||= name === 'dispatch'
    signals.readsLiveState ||= name === 'getState'
  })
  return signals
}

const normalizedNodeName = (typescript, node, sourceFile) =>
  nodeName(typescript, node, sourceFile).replace(/\s+/g, '')

/** Resolve direct actionCreator registrations and the statically enumerable
 * action creators inside one isAnyOf matcher without guessing opaque predicates.
 */
const actionCreatorsOf = (typescript, config, sourceFile) => {
  const actionValue = propertyValue(
    typescript,
    propertyNamed(typescript, config, sourceFile, 'actionCreator')
  )
  const matcherValue = propertyValue(
    typescript,
    propertyNamed(typescript, config, sourceFile, 'matcher')
  )
  const matcherActions =
    matcherValue &&
    typescript.isCallExpression(matcherValue) &&
    callName(typescript, matcherValue) === 'isAnyOf'
      ? matcherValue.arguments.map((argument) =>
          normalizedNodeName(typescript, unwrap(typescript, argument), sourceFile)
        )
      : []
  return [
    ...(actionValue ? [normalizedNodeName(typescript, actionValue, sourceFile)] : []),
    ...matcherActions,
  ].filter(Boolean)
}

const registrationsForFile = (context, typescript, filePath) => {
  const sourceFile = parseSource(typescript, filePath, context.readText(filePath))
  let registrations = []
  walkNodes(typescript, sourceFile, (node) => {
    if (
      !typescript.isCallExpression(node) ||
      !listenerCalls.includes(callName(typescript, node))
    )
      return
    const config = unwrap(typescript, node.arguments[0])
    if (!config || !typescript.isObjectLiteralExpression(config)) return
    const actionCreators = actionCreatorsOf(typescript, config, sourceFile)
    if (!actionCreators.length) return
    const effect = propertyValue(
      typescript,
      propertyNamed(typescript, config, sourceFile, 'effect')
    )
    const registration = {
      filePath,
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
      ...effectSignals(typescript, effect),
    }
    registrations = [
      ...registrations,
      ...actionCreators.map((actionCreator) => ({ ...registration, actionCreator })),
    ]
  })
  return registrations
}

/** Collect direct and statically enumerable isAnyOf listener registrations from
 * this app's one source tree.
 * User Story: As a checker maintainer, I need listener cohorts derived without package or workspace discovery.
 * @signature export const listenerRegistrationsOf = (context) => readonly object[]
 */
export const listenerRegistrationsOf = (context) => {
  const typescript = resolveTypescript(context.projectRoot)
  return typescript
    ? context.sourceFiles.flatMap((filePath) =>
        registrationsForFile(context, typescript, filePath)
      )
    : []
}

const registrationsByAction = (registrations) =>
  registrations
    .reduce(
      (actions, { actionCreator }) =>
        actions.includes(actionCreator) ? actions : [...actions, actionCreator],
      []
    )
    .map((actionCreator) => [
      actionCreator,
      registrations.filter(
        (registration) => registration.actionCreator === actionCreator
      ),
    ])

const locationOf = (context) => (registration) =>
  `${context.relativeToProject(registration.filePath)}:${registration.line}`

/** Flag only the observable order-risk cohort: sibling listeners for one action
 * collectively read the live store and synchronously dispatch nested work. Static
 * analysis cannot decide whether their domain effects commute, so this is review.
 * User Story: As an agent, I need registration-order risks named without false proof of a semantic defect.
 * @signature export const collectListenerOrderSmells = (context) => readonly object[]
 */
export const collectListenerOrderSmells = (context) =>
  [...registrationsByAction(listenerRegistrationsOf(context))]
    .filter(
      ([, registrations]) =>
        registrations.length > 1 &&
        registrations.some(({ dispatches }) => dispatches) &&
        registrations.some(({ readsLiveState }) => readsLiveState)
    )
    .map(([actionCreator, registrations]) => ({
      level: 'SMELL',
      skill: 'orchestrate-side-effects/handle-side-effects',
      skillFile: `${skillRoot}/SKILL.md`,
      relatedSkills: [
        {
          skill: 'build-modern-redux-apps/redux-dataflow',
          skillFile: `${skillDirectoryOf('build-modern-redux-apps-redux-dataflow')}/SKILL.md`,
        },
      ],
      reference: 'https://redux-toolkit.js.org/api/createListenerMiddleware',
      guidance: `${actionCreator} has ${registrations.length} listener owners at ${registrations.map(locationOf(context)).join(', ')}; the cohort reads live state and dispatches nested actions, so registration or import order can change the state later siblings observe. Agent judgment is required: prove the effects independent or replace the cohort with one explicit orchestrator.`,
    }))

/** Enforce this app's one authoritative station-turn workflow after the turn
 * orchestrator replaces sibling actionCommitted subscriptions.
 * User Story: As a station maintainer, I need gameplay turns sequenced by one listener owner rather than import order.
 * @signature export const collectGameplayTurnOwnerFindings = (context) => string[]
 */
export const collectGameplayTurnOwnerFindings = (context) => {
  const allRegistrations = listenerRegistrationsOf(context)
  const registrations = allRegistrations.filter(
    ({ actionCreator }) => actionCreator === gameplayTurnAction
  )
  const nestedTurnOwners = allRegistrations.filter(
    ({ actionCreator }) => actionCreator === aiTurnAction
  )
  const contractApplies =
    registrations.length > 0 ||
    context.sourceFiles.some((filePath) =>
      context.readText(filePath).includes(gameplayTurnAction)
    )
  return contractApplies
    ? [
        ...(registrations.length !== 1
          ? [
              `${gameplayTurnAction}: expected exactly one listener owner, found ${registrations.length}${registrations.length ? ` at ${registrations.map(locationOf(context)).join(', ')}` : ''}`,
            ]
          : []),
        ...(nestedTurnOwners.length
          ? [
              `${aiTurnAction}: expected no sibling listener owners because the gameplay turn orchestrator owns this phase, found ${nestedTurnOwners.length} at ${nestedTurnOwners.map(locationOf(context)).join(', ')}`,
            ]
          : []),
      ]
    : []
}

/** Enforce one authoritative post-defeat workflow so quest XP cannot invalidate
 * evidence observed later by a sibling favor listener.
 * User Story: As a combat maintainer, I need defeat consequences sequenced by state evidence rather than listener import order.
 * @signature export const collectCombatDefeatOwnerFindings = (context) => string[]
 */
export const collectCombatDefeatOwnerFindings = (context) => {
  const allRegistrations = listenerRegistrationsOf(context)
  const registrations = allRegistrations.filter(
    ({ actionCreator }) => actionCreator === combatDefeatAction
  )
  const contractApplies =
    registrations.length > 0 ||
    context.sourceFiles.some((filePath) =>
      context.readText(filePath).includes(combatDefeatAction)
    )
  return contractApplies && registrations.length !== 1
    ? [
        `${combatDefeatAction}: expected exactly one aftermath workflow owner, found ${registrations.length}${registrations.length ? ` at ${registrations.map(locationOf(context)).join(', ')}` : ''}`,
      ]
    : []
}
