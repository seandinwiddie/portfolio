const normalizedPath = (filePath) => String(filePath).replaceAll('\\', '/')
const filenameStem = (filePath) =>
  normalizedPath(filePath)
    .split('/')
    .at(-1)
    ?.replace(/\.[^.]+$/, '')
    .replace(/\.(?:native|web|ios|android)$/i, '') ?? ''

const ecsComponentPath = (filePath) =>
  /(?:^|\/)src\/features\/components(?:\/|$)/i.test(filePath)

const domainFetchAdapterPath = (filePath) =>
  /(?:^|\/)src\/features\/systems(?:\/|$)/i.test(filePath) &&
  /(?:^|\/)quest\/fetch(?:\/|$)/i.test(filePath) &&
  /Adapters?$/i.test(filenameStem(filePath))

const rootCompositionPath = (filePath) =>
  /^(?:src\/)?(?:index|store|root|rootReducer|app)\.(?:[cm]?[jt]sx?)$/i.test(filePath)

const boundaryPath = (filePath) =>
  /(?:^|\/)app(?:\/|$)/i.test(filePath) ||
  /^(?:src\/)?routes?(?:\/|$)/i.test(filePath) ||
  /(?:^|\/)views?(?:\/|$)/i.test(filePath) ||
  /(?:^|\/)components(?:\/|$)/i.test(filePath) ||
  /\.[cm]?[jt]sx$/i.test(filePath) ||
  /(?:Thunks?|Listeners?)$/i.test(filenameStem(filePath)) ||
  /Api$/i.test(filenameStem(filePath)) ||
  rootCompositionPath(filePath)

const knownBoundaryAdapter = (filePath) =>
  /Adapters?$/i.test(filenameStem(filePath)) &&
  /(?:^|\/)(?:api|audio|database|filesystem|http|io|network|persistence|storage)(?:\/|$)/i.test(
    filePath
  )

const explicitCoreRole = (filePath) =>
  /(?:Selectors?|Slices?|Reducers?)$/i.test(filenameStem(filePath)) ||
  /(?:^|\/)(?:selectors?|reducers?)(?:\/|$)/i.test(filePath)

export const classifyFpSourceScope = (filePath) => {
  const normalized = normalizedPath(filePath)
  if (ecsComponentPath(normalized) || domainFetchAdapterPath(normalized)) return 'core'
  if (boundaryPath(normalized) || knownBoundaryAdapter(normalized)) return 'boundary'
  if (explicitCoreRole(normalized)) return 'core'
  if (/Adapters?$/i.test(filenameStem(normalized))) return 'ambiguous'
  return 'core'
}

export const dispositionForScope = (scope) => (scope === 'core' ? 'BLOCK' : 'REVIEW')
