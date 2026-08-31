import path from 'node:path'

export const importRegex =
  /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

export const forbiddenTargetRoles = {
  types: new Set([
    'actions',
    'selectors',
    'thunks',
    'listeners',
    'adapters',
    'slice',
    'api',
    'view',
  ]),
  actions: new Set(['selectors', 'listeners', 'view']),
  adapters: new Set(['actions', 'listeners', 'view']),
  listeners: new Set(['view']),
  reducers: new Set(['api', 'listeners', 'thunks', 'view']),
  selectors: new Set(['actions', 'thunks', 'listeners', 'api', 'view']),
  slice: new Set(['listeners', 'view']),
  thunks: new Set(['listeners', 'view']),
  api: new Set(['slice', 'thunks', 'listeners', 'view']),
}

export const allowedViewFeatureRoles = new Set(['actions', 'selectors'])

export const ownedFactoryPatterns = {
  actions: /\bcreateAction\s*\(/,
  adapters: /\bcreateEntityAdapter\s*\(/,
  listeners: /\bcreateListenerMiddleware\s*\(/,
  slice: /\bcreateSlice\s*\(/,
  thunks: /\bcreateAsyncThunk\s*(?:<|\()/,
  api: /\bcreateApi\s*\(|\binjectEndpoints\s*\(/,
}

export const sideEffectPatterns = [
  [/\bfetch\s*\(/, 'fetches data'],
  [/\bsetTimeout\s*\(/, 'schedules a timeout'],
  [/\bsetInterval\s*\(/, 'schedules an interval'],
  [/\blocalStorage\b|\bsessionStorage\b/, 'uses browser storage'],
  [/\bfs\./, 'uses filesystem IO'],
  [/\bprocess\.env\b/, 'reads process environment'],
]

export const viewPatterns = {
  storeAccess:
    /\bStore::GetStore\s*\(|\bstore\.(?:dispatch|getState)\s*\(|\bdispatch\s*\(|\.dispatch\s*\(|\bgetState\s*\(|\.getState\s*\(/g,
  asyncWorkflow:
    /\bcreateAsyncThunk\s*\(|\bcreateListenerMiddleware\s*\(|\bstartListening\b/g,
  cachePatch: /\bupdateQueryData\s*\(/g,
  boundaryIo:
    /\bfs\.|\breadFileSync\b|\bwriteFileSync\b|\bprocess\.(?:argv|env)\b|\bfetch\s*\(|\bchild_process\b|\blocalStorage\b|\bsessionStorage\b/g,
}

export const viewLogicPatterns = [
  [/\bif\s*\(/g, 'contains conditional logic'],
  [/\belse\b/g, 'contains conditional branching'],
  [/\bswitch\s*\(/g, 'contains switch branching'],
  [/\bfor\s*\(/g, 'contains loop logic'],
  [/\bwhile\s*\(/g, 'contains loop logic'],
  [
    /\.(?:filter|reduce|some|find|every|sort|startsWith|split|match|test)\s*\(/g,
    'derives data instead of rendering a prepared view model',
  ],
  [
    /\bObject\.(?:values|keys|entries)\s*\(/g,
    'inspects object shape instead of rendering a prepared view model',
  ],
  [/\bJSON\./g, 'parses or serializes data'],
  [/\bMath\./g, 'calculates values'],
  [/\bDate\b/g, 'reads time'],
  [/\bnew\s+Function\b/g, 'creates runtime code'],
  [/\bimport\s*\(/g, 'loads runtime modules dynamically'],
]

export const roleLeafStem = (specifier) =>
  path
    .basename(specifier.split('\\').join('/'))
    .replace(/\.(?:tsx?|jsx?|mts|cts|mjs|cjs)$/i, '')
    .replace(/\.(?:native|web|ios|android)$/i, '')

export const roleForSpecifier = (specifier) => {
  const normalized = specifier.split('\\').join('/')
  const stem = roleLeafStem(normalized).toLowerCase()
  if (/(^|\/)views(\/|$)/i.test(normalized) || stem.endsWith('view')) return 'view'
  if (stem.endsWith('api')) return 'api'
  if (stem.endsWith('actions') || stem.endsWith('action')) return 'actions'
  if (stem.endsWith('adapters') || stem.endsWith('adapter')) return 'adapters'
  if (
    stem.endsWith('listeners') ||
    stem.endsWith('listener') ||
    stem.endsWith('middleware') ||
    stem === 'protocollogger'
  )
    return 'listeners'
  if (stem.endsWith('reducers') || stem.endsWith('reducer')) return 'reducers'
  if (stem.endsWith('selectors') || stem.endsWith('selector')) return 'selectors'
  if (stem.endsWith('slice')) return 'slice'
  if (stem.endsWith('thunks') || stem.endsWith('thunk')) return 'thunks'
  if (stem.endsWith('types') || stem.endsWith('type')) return 'types'
  return null
}
