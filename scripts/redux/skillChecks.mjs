import path from 'node:path'
import { importRegex, roleLeafStem } from './roleRules.mjs'

// Anti-patterns the redux/rtk skills forbid outright, enforced across every ECS role file.
const skillBanPatterns = [
  [
    /\bcreateStore\s*\(/g,
    'uses legacy createStore; the store must be assembled with configureStore (modern-redux, migrate-to-modern-redux)',
  ],
  [
    /(?<!\.)\bconnect\s*\(/g,
    'uses react-redux connect(); modern React-Redux is hooks — useSelector/useDispatch (modern-redux)',
  ],
  [
    /\bmiddleware:\s*\[/g,
    'passes middleware as an array; RTK 2 requires a (getDefaultMiddleware) => ... callback (migrate-to-modern-redux)',
  ],
  [
    /\bextraReducers:\s*\{/g,
    'uses object-form extraReducers; RTK 2 requires the builder callback form (slices-and-selectors)',
  ],
]

// Redux state must stay serializable — no Date/Set/Map/class instances in a slice.
const sliceSerializablePatterns = [
  [
    /\bnew\s+(?:Date|Set|Map|WeakMap|WeakSet)\s*\(/g,
    'constructs a non-serializable value in slice state; keep Redux state serializable — ISO strings and plain arrays (debug-redux-toolkit-apps)',
  ],
]

// Actions must describe events, not setters — a reducer named set<X> hides the
// transition behind a generic setter, so the action log no longer explains what
// the app did. Reset/hydrate are lifecycle, not setters (redux-dataflow).
const setterReducerPattern =
  /(?:^|\n)[ \t]*(?:export[ \t]+)?const[ \t]+(set[A-Z][A-Za-z0-9]*)[ \t]*=[ \t]*\([ \t]*_?state\b/g

// A reducer owns its slice shape — blindly spreading action.payload treats the
// payload as a trusted whole-state patch; assign the fields the event carries
// (redux-dataflow CRITICAL, design-state-ownership).
const blindPayloadPattern =
  /\{\s*\.\.\.\s*state\s*,\s*\.\.\.\s*action\.payload|\.\.\.\s*action\.payload\s*,\s*\.\.\.\s*state|Object\.assign\s*\(\s*state\s*,\s*action\.payload/g

// Listener middleware add/remove actions carry functions, so the listener
// middleware must be PREPENDED (ahead of the default serializability check),
// never concatenated after it (handle-side-effects, CRITICAL).
const listenerConcatPattern = /getDefaultMiddleware\s*\([^)]*\)\s*\.concat\s*\(/

export const collectSkillFindings = (context, unit) => {
  const findings = []
  for (const [pattern, summary] of skillBanPatterns) {
    for (const match of unit.text.matchAll(pattern)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: ${summary}`
      )
    }
  }
  if (unit.role === 'slice') {
    for (const [pattern, summary] of sliceSerializablePatterns) {
      for (const match of unit.text.matchAll(pattern)) {
        findings.push(
          `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: ${summary}`
        )
      }
    }
    for (const match of unit.text.matchAll(setterReducerPattern)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: reducer ${match[1]} is setter-style; dispatch an event that names what happened (e.g. noteChanged, not setNote) so the action log explains the app (redux-dataflow)`
      )
    }
    for (const match of unit.text.matchAll(blindPayloadPattern)) {
      findings.push(
        `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: reducer blindly spreads action.payload into state; the reducer owns the slice shape — assign the fields the event carries, not the whole payload (redux-dataflow, design-state-ownership)`
      )
    }
  }
  if (
    /\bcreateListenerMiddleware\s*\(/.test(unit.text) &&
    listenerConcatPattern.test(unit.text) &&
    !/\.prepend\s*\(/.test(unit.text)
  ) {
    const index = unit.text.search(listenerConcatPattern)
    findings.push(
      `${unit.rel}:${context.lineNumber(unit.text, index)}: listener middleware must be prepended — getDefaultMiddleware().prepend(listenerMiddleware.middleware) — not concatenated, so it runs before the serializability check (handle-side-effects)`
    )
  }
  return findings
}

const viewTypeDeclarationPattern =
  /(?:^|\n)[ \t]*(?:export[ \t]+)?(?:type|interface)[ \t]+[A-Za-z]/g

// Views are presentational — the view-model type lives in the domain selectors and
// is imported (import type is allowed); a view may not declare types/interfaces.
export const collectViewTypeFindings = (context, unit) => {
  if (unit.role !== 'view') return []
  const findings = []
  for (const match of unit.text.matchAll(viewTypeDeclarationPattern)) {
    findings.push(
      `${unit.rel}:${context.lineNumber(unit.text, match.index ?? 0)}: view declares a type; views are presentational — define the view-model type in the domain's selectors and import it (import type is allowed, declaring is not)`
    )
  }
  return findings
}

const storeSpecifierPattern = /(^|\/)store(\.[a-z0-9]+)?$/i

// The app root index is the public surface: per modern-redux it exposes only
// the store (and its types); everything else is imported directly from its feature folder.
export const collectIndexBarrelFindings = (context) => {
  const findings = []
  for (const filePath of context.sourceFiles) {
    if (path.resolve(path.dirname(filePath)) !== path.resolve(context.srcRoot)) continue
    if (roleLeafStem(filePath).toLowerCase() !== 'index') continue
    const rel = context.relativeToProject(filePath)
    const text = context.readText(filePath)
    for (const match of text.matchAll(importRegex)) {
      const specifier = (match[1] ?? match[2] ?? match[3]).split('\\').join('/')
      if (!storeSpecifierPattern.test(specifier)) {
        findings.push(
          `${rel}:${context.lineNumber(text, match.index ?? 0)}: app index re-exports from ${specifier}; the root index is the public surface and may re-export only the store — import feature slices/selectors/views directly (modern-redux)`
        )
      }
    }
  }
  return findings
}
