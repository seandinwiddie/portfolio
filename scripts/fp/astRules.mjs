export const FRAMEWORK_CLASS_MARKER = '@fp-framework-boundary'
export const TRAMPOLINE_DRIVER_MARKER = '@fp-trampoline-driver'
import { skillFileOf } from '../skill-paths.mjs'

export const FP_SKILL_PATH = skillFileOf('fp')
export const FP_SKILL_REVIEW_ADVICE = [
  `Read the complete fp skill at ${FP_SKILL_PATH} before acting on this finding.`,
  'REVIEW and SMELL findings require contextual disposition and do not block.',
].join(' ')

export const FP_AST_MARKER_DOCUMENTATION = Object.freeze({
  [FRAMEWORK_CLASS_MARKER]: [
    'Place `/** @fp-framework-boundary <framework or reflection reason> */`',
    'directly on a class declaration, or on the function/variable that owns one',
    'framework-required `new` expression. A class may have no fields and at most',
    'two thin members; a constructor adapter may have at most two parameters and',
    'one return statement. A nonempty reason is required.',
  ].join(' '),
  [TRAMPOLINE_DRIVER_MARKER]: [
    'Place `/** @fp-trampoline-driver */` directly on the function declaration',
    'or variable statement named `trampoline`. Exactly one loop owned by that',
    'function is exempt; nested-function loops and every other statement rule',
    'remain enforced.',
  ].join(' '),
})

export const FP_SKILL_GUIDANCE = Object.freeze({
  classes: [
    '**Zero classes.** Factory functions returning data plus closures. No `new`,',
    'no `this`/`self`, no inheritance. Framework and reflection boundaries that',
    'require a class are the documented exception and stay thin.',
  ].join(' '),
  arity: [
    '**Two data parameters maximum.** Over-arity is fixed by *splitting the function*,',
    'not by bundling arguments into a payload object — an object hides the arity,',
    'it does not reduce the work. Reach for currying, partial application,',
    'functions-as-arguments, and folds.',
  ].join(' '),
  statements: [
    '**No `if` / `for` / `while` / `loop` / `switch` statements** in core runtime',
    'code. A branch is routed by shape (`match`), by key (dispatch table), or by',
    'predicate combinator; iteration is a fold; unbounded iteration is a',
    'trampoline. Statements that *do* something and return nothing have no place',
    'in a pipeline. See *Replace branches by data shape* and *Replace loops with',
    'folds and a trampoline*.',
  ].join(' '),
  wrapperNouns: [
    '**No lazy wrapper nouns** — `Manager`, `Helper`, `Util(s)`, `Bag`, `Fixture`.',
    'They hide the role. Name the composition boundary instead.',
  ].join(' '),
  serializableState: [
    'Tagged wrappers in serializable state break serialization, hydration, and',
    'time-travel. Keep plain data in state and lift at the edge.',
  ].join(' '),
  conditionalChain: 'A ternary chain is an `if` that learned to hide.',
  nestedCompose: 'No hand-composed `compose(compose(...))`. Use `pipe` / `fold`.',
  recursion: [
    'Hand-rolled recursion over a bounded collection reimplements a fold, badly.',
    'Use `map` / `filter` / `fold` / `traverse`. If depth is unbounded, return',
    '`Call` / `Done` and use the single core trampoline.',
  ].join(' '),
})

export const FP_AST_RULES = Object.freeze({
  classMechanics: Object.freeze({
    id: 'FP-AST-001',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:51-53`,
    guidance: FP_SKILL_GUIDANCE.classes,
  }),
  controlStatement: Object.freeze({
    id: 'FP-AST-002',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:58-63`,
    guidance: FP_SKILL_GUIDANCE.statements,
  }),
  dataArity: Object.freeze({
    id: 'FP-AST-003',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:54-57`,
    guidance: FP_SKILL_GUIDANCE.arity,
  }),
  payloadArity: Object.freeze({
    id: 'FP-AST-004',
    disposition: 'REVIEW',
    skillRef: `${FP_SKILL_PATH}:54-57;${FP_SKILL_PATH}:398-421`,
    guidance: FP_SKILL_GUIDANCE.arity,
  }),
  wrapperNoun: Object.freeze({
    id: 'FP-AST-005',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:66-67`,
    guidance: FP_SKILL_GUIDANCE.wrapperNouns,
  }),
  serializableState: Object.freeze({
    id: 'FP-AST-006',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:321-341`,
    guidance: FP_SKILL_GUIDANCE.serializableState,
  }),
  conditionalChain: Object.freeze({
    id: 'FP-AST-007',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:230-242;${FP_SKILL_PATH}:446-467`,
    guidance: FP_SKILL_GUIDANCE.conditionalChain,
  }),
  nestedCompose: Object.freeze({
    id: 'FP-AST-008',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:304-307`,
    guidance: FP_SKILL_GUIDANCE.nestedCompose,
  }),
  directRecursion: Object.freeze({
    id: 'FP-AST-009',
    disposition: 'SMELL',
    skillRef: `${FP_SKILL_PATH}:260-283;${FP_SKILL_PATH}:343-369;${FP_SKILL_PATH}:515-536`,
    guidance: FP_SKILL_GUIDANCE.recursion,
  }),
  documentedException: Object.freeze({
    id: 'FP-AST-010',
    disposition: 'REVIEW',
    skillRef: `${FP_SKILL_PATH}:51-53;${FP_SKILL_PATH}:260-283;${FP_SKILL_PATH}:343-369`,
    guidance:
      'A static marker cannot prove framework necessity or lawful Bounce semantics; review the documented exception and keep it singular and thin.',
  }),
  callbackTypeReview: Object.freeze({
    id: 'FP-AST-011',
    disposition: 'REVIEW',
    skillRef: `${FP_SKILL_PATH}:54-57;${FP_SKILL_PATH}:398-421`,
    guidance:
      'A callback-looking imported or unresolved type is not proof that the parameter carries behavior rather than data. Resolve the type and confirm that excluding it does not hide a function with more than two data parameters.',
  }),
  coreDependency: Object.freeze({
    id: 'FP-AST-012',
    disposition: 'BLOCK',
    skillRef: `${FP_SKILL_PATH}:64-65;${FP_SKILL_PATH}:297-312`,
    guidance:
      'The functional core depends on no outer layer. Move the dependency to a boundary and inject plain data or capabilities into the core.',
  }),
  unresolvedStateTypeReview: Object.freeze({
    id: 'FP-AST-013',
    disposition: 'REVIEW',
    skillRef: `${FP_SKILL_PATH}:321-341`,
    guidance:
      'An imported or opaque Redux state shape cannot be proven plain from one source file. Resolve the type, config, factory, or call result and confirm that no Maybe, Either, Validation, or other rich tagged wrapper is stored.',
  }),
})

export const formatFpAstFinding = (finding) =>
  [
    `${finding.file}:${finding.line}:${finding.column}: [${finding.disposition} ${finding.ruleId}] ${finding.message}`,
    `    skill: ${finding.skillRef}`,
    `    advice: ${finding.advice}`,
    `    guidance: ${finding.guidance}`,
  ].join('\n')
