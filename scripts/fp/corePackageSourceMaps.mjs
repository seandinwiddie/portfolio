import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

const sourceMapUrl = (text) =>
  [
    ...text.matchAll(/(?:\/\*[#@]|\/\/[#@])\s*sourceMappingURL=([^\s*]+)(?:\s*\*\/)?/g),
  ].at(-1)?.[1] ?? null

const inside = (root, target) => {
  const path = relative(root, target)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}

const inlineMap = (url) => {
  if (!url.startsWith('data:')) return null
  const comma = url.indexOf(',')
  if (comma < 0) return null
  const metadata = url.slice(0, comma)
  const payload = url.slice(comma + 1)
  try {
    return metadata.includes(';base64')
      ? Buffer.from(payload, 'base64').toString('utf8')
      : decodeURIComponent(payload)
  } catch {
    return null
  }
}

const loadMap = async (module, packageDirectory) => {
  const url = sourceMapUrl(module.text)
  if (!url) return null
  const embedded = inlineMap(url)
  if (embedded !== null) return { text: embedded, directory: dirname(module.path) }
  const path = resolve(dirname(module.path), url.replace(/[?#].*$/, ''))
  if (!inside(packageDirectory, path)) return null
  return readFile(path, 'utf8').then(
    (text) => ({ text, directory: dirname(path) }),
    () => null
  )
}

const sourcePath = (loaded, map, source, packageDirectory) => {
  const rooted = `${map.sourceRoot ?? ''}${source}`
  if (/^[A-Za-z][A-Za-z+.-]*:\/\//.test(rooted)) {
    return `${loaded.directory}/${source.replace(/^.*:\/\//, '')}`
  }
  const path = resolve(loaded.directory, rooted)
  return inside(packageDirectory, path) ? path : `${loaded.directory}/${source}`
}

const sourceText = async (loaded, map, source, index, packageDirectory) => {
  const embedded = map.sourcesContent?.[index]
  if (typeof embedded === 'string') return embedded
  const path = sourcePath(loaded, map, source, packageDirectory)
  return inside(packageDirectory, path) ? readFile(path, 'utf8').catch(() => null) : null
}

export const authoredSourcesFor = async (module, packageDirectory) => {
  const loaded = await loadMap(module, packageDirectory)
  if (!loaded) return []
  const map = await Promise.resolve()
    .then(() => JSON.parse(loaded.text))
    .catch(() => null)
  if (!map || !Array.isArray(map.sources)) return []
  const units = await Promise.all(
    map.sources.map(async (source, index) => ({
      path: sourcePath(loaded, map, source, packageDirectory),
      text: await sourceText(loaded, map, source, index, packageDirectory),
      mode: module.mode,
      authored: true,
    }))
  )
  return units.filter(({ text }) => typeof text === 'string')
}
