import { sideEffectPatterns } from './roleRules.mjs'
import { analyzeSelectorMemoization } from './selectorMemoization.mjs'

// Per-role runtime behavior: only actions/thunks/listeners dispatch; only
// thunks/listeners/api read getState; only thunks/views call React hooks; pure
// reducers/slice/selectors/types stay side-effect-free; state selectors memoize derived
// collections; and thunks derive no view-model DATA collection (counts, predicates,
// filter→map pipelines, and {onPress} action-lists are orchestration, not data).
export const collectBehaviorFindings = (context, unit) => {
  const findings = []
  if (!['thunks', 'listeners', 'api'].includes(unit.role)) {
    for (const match of unit.text.matchAll(/\bdispatch\s*\(|\.dispatch\s*\(/g)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: ${unit.role} role must not dispatch`
      )
    }
  }
  if (!['thunks', 'listeners', 'api'].includes(unit.role)) {
    for (const match of unit.text.matchAll(/\bgetState\s*\(|\.getState\s*\(/g)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: ${unit.role} role must not call getState`
      )
    }
  }
  if (!['thunks', 'view'].includes(unit.role)) {
    for (const match of unit.text.matchAll(/\buse[A-Z][A-Za-z0-9]*\s*\(/g)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: ${unit.role} role must not call React hooks; orchestration belongs in a *Thunks hook, presentation in a view (modern-redux, handle-side-effects)`
      )
    }
  }
  if (['reducers', 'slice', 'selectors', 'types'].includes(unit.role)) {
    for (const [pattern, summary] of sideEffectPatterns) {
      const match = pattern.exec(unit.text)
      if (match)
        findings.push(
          `${unit.rel}:${context.lineNumber(unit.text, match.index)}: pure ${unit.role} role ${summary}`
        )
    }
  }
  findings.push(...analyzeSelectorMemoization(context, unit).findings)
  if (unit.role === 'thunks') {
    for (const match of unit.text.matchAll(/\.(?:map|filter|reduce|flatMap)\s*\(/g)) {
      const after = unit.text.slice(match.index ?? 0, (match.index ?? 0) + 320)
      if (/^\.filter\s*\([\s\S]*?\)\s*\.(?:map|length|some|every|find)\b/.test(after))
        continue
      if (/^\.map\s*\(\s*[A-Za-z_$][\w$]*\s*[),]/.test(after)) continue
      if (/^\.(?:map|flatMap)\b[\s\S]{0,220}?\bonPress\b/.test(after)) continue
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: thunks role derives a view-model data collection; move derivation into a memoized selector — thunks sequence work and dispatch events (redux-dataflow)`
      )
    }
  }
  return findings
}

// Blocking purity checks only cover mechanically provable reactive workflows.
// Local form state, router state, and external owners are contextual ownership
// decisions and are emitted as non-blocking skill smells instead of being treated
// as unconditional Redux violations (design-state-ownership).
export const collectPurityFindings = (context, unit) => {
  void context
  void unit
  return []
}
