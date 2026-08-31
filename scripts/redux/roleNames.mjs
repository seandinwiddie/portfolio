import { roleLeafStem } from './roleRules.mjs'

const ownershipMarkers = ['features', 'components', 'entities', 'systems', 'views']
const roleStemByRole = {
  actions: 'Actions',
  adapters: 'Adapters',
  api: 'Api',
  listeners: 'Listeners',
  reducers: 'Reducers',
  selectors: 'Selectors',
  slice: 'Slice',
  thunks: 'Thunks',
  types: 'Types',
  view: 'View',
}

const domainParts = (context, filePath) => {
  const parts = context.relativeToProject(filePath).split('/')
  const markerIndex = Math.max(
    ...ownershipMarkers.map((marker) => parts.lastIndexOf(marker))
  )
  return markerIndex < 0 ? [] : parts.slice(markerIndex + 1, -1)
}

const camelDomain = (parts) =>
  parts
    .flatMap((part) => part.split(/[^A-Za-z0-9]+/).filter(Boolean))
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join('')

const layeredRoleStems = (context, unit) => {
  const parts = domainParts(context, unit.filePath)
  const roleStem = roleStemByRole[unit.role]
  if (!parts.length || !roleStem) return []
  return parts
    .map((_, index) => camelDomain(parts.slice(parts.length - index - 1)) + roleStem)
    .map((stem) => stem.slice(0, 1).toLowerCase() + stem.slice(1))
}

// A role source leaf must be its own domain-qualified name (roomSelectors, not
// selectors) and only layer parent domains when the nearest name collides.
export const collectRoleNameFindings = (context, roleFiles) => {
  const candidates = roleFiles
    .map((unit) => ({ unit, stems: layeredRoleStems(context, unit) }))
    .filter(({ stems }) => stems.length)
  const nearestCounts = new Map()
  for (const { unit, stems } of candidates) {
    const key = `${unit.role}|${stems[0].toLowerCase()}`
    nearestCounts.set(key, (nearestCounts.get(key) ?? 0) + 1)
  }

  return candidates.flatMap(({ unit, stems }) => {
    const actual = roleLeafStem(unit.filePath)
    if (actual.toLowerCase() === stems[0].toLowerCase()) return []
    const key = `${unit.role}|${stems[0].toLowerCase()}`
    const hasConflict = (nearestCounts.get(key) ?? 0) > 1
    const layeredMatch =
      hasConflict &&
      stems.slice(1).some((stem) => stem.toLowerCase() === actual.toLowerCase())
    return layeredMatch
      ? []
      : [
          `${unit.rel}:1: role source leaf ${actual} must be ${stems[0]}; only layer parent domains when ${stems[0]} conflicts`,
        ]
  })
}
