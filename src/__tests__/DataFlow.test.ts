import { apiSlice } from '../features/systems/platform/foundation/api/apiApi'
import { makeTestStore } from '../test/providers.test.helper'
import { TEST_INITIAL_STATE } from '../test/apiPayload.test.data'
import { mockFailedFetch, mockJsonFetch } from '../test/fetch.test.helper'

// This suite previously imported `../App`, a module that does not exist in this
// repo, so it could never run. It exercises the documented data flow instead:
// json > api slice > store > feature slices.
describe('Data Flow', () => {
  const payload = TEST_INITIAL_STATE

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fans the /data response out into the brandName, body and nav slices', async () => {
    global.fetch = mockJsonFetch(payload)

    const store = makeTestStore()
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate())

    const state = store.getState()
    expect(state.brandName.value).toBe('Test Brand')
    expect(state.brandName.isLoading).toBe(false)
    expect(state.nav.brandName).toBe('Test Brand')
    expect(state.body.description).toBe('Test Description')
    expect(state.body.portfolioFeatures).toHaveLength(1)
    expect(state.body.appProcedures).toHaveLength(1)
    expect(state.ambientScene.world).toEqual(payload.ambientScene)
    expect(state.ambientScene.loadState).toBe('ready')
  })

  it('marks the payload source so the UI can report API health', async () => {
    global.fetch = mockJsonFetch(payload)
    const store = makeTestStore()
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate())
    expect(store.getState().body.source).toBe('network')
  })

  it('keeps authored entities empty and reports the failed API request', async () => {
    global.fetch = mockFailedFetch()

    const store = makeTestStore()
    const result = await store.dispatch(apiSlice.endpoints.getInitialState.initiate())

    const state = store.getState()
    expect(result.error).toBeDefined()
    expect(state.body.portfolioFeatures).toEqual([])
    expect(state.brandName.value).toBe('')
    expect(state.body.source).toBe('error')
    expect(state.ambientScene.world).toBeNull()
    expect(state.ambientScene.loadState).toBe('error')
  })
})
