import { apiSlice } from '../features/systems/substrate/kernel/api/apiApi'
import { makeTestStore } from '../test/providers.test.helper'
import { TEST_INITIAL_STATE } from '../test/apiPayload.test.data'
import { mockFailedFetch, mockJsonFetch } from '../test/fetch.test.helper'

// The RTK Query document cache is the sole server-data authority. Feature
// compositions project it directly with selectFromResult rather than mirroring
// the response into entity slices.
describe('Data Flow', () => {
  const payload = TEST_INITIAL_STATE

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('keeps the normalized /data response in the RTK Query cache', async () => {
    global.fetch = mockJsonFetch(payload)

    const store = makeTestStore()
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate())

    const state = store.getState()
    const query = apiSlice.endpoints.getInitialState.select()(state)

    expect(query.data).toMatchObject({
      brandName: 'Test Brand',
      description: 'Test Description',
      source: 'network',
      ambientScene: payload.ambientScene,
      presentation: payload.presentation,
    })
    expect(query.data?.registryCapabilities).toHaveLength(1)
    expect(query.data?.operatingProtocols).toHaveLength(1)
  })

  it('does not register compatibility slices for server-owned documents', () => {
    const state = makeTestStore().getState()

    expect(state).not.toHaveProperty('brandName')
    expect(state).not.toHaveProperty('nav')
    expect(state).not.toHaveProperty('body')
    expect(state).not.toHaveProperty('ambientScene')
  })

  it('marks successful cache data as network-sourced', async () => {
    global.fetch = mockJsonFetch(payload)
    const store = makeTestStore()
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate())

    const query = apiSlice.endpoints.getInitialState.select()(store.getState())
    expect(query.data?.source).toBe('network')
  })

  it('reports a failed request without manufacturing local authored data', async () => {
    global.fetch = mockFailedFetch()

    const store = makeTestStore()
    const result = await store.dispatch(apiSlice.endpoints.getInitialState.initiate())

    const state = store.getState()
    const query = apiSlice.endpoints.getInitialState.select()(state)

    expect(result.error).toBeDefined()
    expect(query.status).toBe('rejected')
    expect(query.data).toBeUndefined()
    expect(state).not.toHaveProperty('body')
  })
})
