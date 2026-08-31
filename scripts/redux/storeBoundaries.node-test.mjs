import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { collectStoreBoundaryFindings } from './storeBoundaries.mjs'

const projectRoot = path.resolve('virtual-app')
const root = path.join(projectRoot, 'src')
const store = path.join(root, 'store.ts')

/**
 * Creates a minimal source-derived store checker context.
 * User Story: As a checker maintainer, I need focused fixtures so root-store
 * false positives fail without depending on a repository checkout.
 * @signature const contextFor = ({ stores, configured }) => object
 */
const contextFor = ({ stores = [store], configured = [store] } = {}) => ({
  storeFiles: stores,
  configureStoreFiles: configured,
  srcRoot: root,
  relativeToProject: (filePath) => path.relative(projectRoot, filePath),
})

test('accepts exactly one configured app root store', () => {
  assert.deepEqual(collectStoreBoundaryFindings(contextFor()), [])
})

test('rejects a root store that does not assemble configureStore', () => {
  assert.match(
    collectStoreBoundaryFindings(contextFor({ configured: [] }))[0],
    /app root store must assemble configureStore directly/
  )
})

test('rejects configureStore assembly outside the root store', () => {
  const featureStore = path.join(root, 'features', 'session', 'sessionAdapters.ts')
  const findings = collectStoreBoundaryFindings(
    contextFor({
      configured: [store, featureStore],
    })
  )
  assert.equal(findings.length, 1)
  assert.match(findings[0], /configureStore must be assembled by the app root store/)
})
