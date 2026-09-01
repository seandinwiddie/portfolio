import { API_TIMEOUT_MS, apiSlice } from './apiApi'
import { setupApiStore } from '../../../../../test/apiStore.test.helper'
import { TEST_INITIAL_STATE } from '../../../../../test/apiPayload.test.data'
import { mockFailedFetch, mockJsonFetch } from '../../../../../test/fetch.test.helper'

describe('apiSlice', () => {
  afterEach(async () => {
    jest.useRealTimers()
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    jest.restoreAllMocks()
  })

  it('normalizes the /data response', async () => {
    const response = TEST_INITIAL_STATE

    global.fetch = mockJsonFetch(response)
    const storeRef = setupApiStore()
    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getInitialState.initiate()
    )

    expect(result.data).toMatchObject({
      brandName: 'Test Brand',
      description: 'Test Description',
      iniTheme: 'light',
    })
    expect(result.data).toHaveProperty('themeCustom')
    expect(result.data?.presentation).toEqual(response.presentation)
    expect(result.data?.presentation?.runtime.sound).toEqual({
      enabledText: 'Test sound on',
      disabledText: 'Test sound off',
      enableLabel: 'Test enable sound',
      disableLabel: 'Test disable sound',
    })
    expect(result.data?.presentation?.runtime.telemetry.labels.feed).toBe(
      'GH + GOOGLE LIVE'
    )
    expect(result.data).not.toHaveProperty('brandNameLoading')
    expect(result.data?.ambientScene.ids).toHaveLength(6)
    expect(result.data?.ambientScene.activity.ids).toEqual([
      'query-sync',
      'query-resolve',
      'route-transit',
      'query-fault',
    ])
    expect(result.data?.source).toBe('network')
  })

  it('returns the RTK Query error when the API is down', async () => {
    global.fetch = mockFailedFetch()

    const storeRef = setupApiStore()
    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getInitialState.initiate()
    )

    expect(result.error).toBeDefined()
    expect(result.data).toBeUndefined()
  })

  it('reads the typed commit archive from /github/commits', async () => {
    const response = {
      commits: [
        {
          sha: 'abc1234',
          repo: 'SEANDINWIDDIE/portfolio',
          at: '2026-08-30T12:00:00Z',
          url: 'https://github.com/SEANDINWIDDIE/portfolio/commit/abc1234',
          type: 'fix',
          scope: 'console',
          summary: 'keep command focus',
          subject: 'fix(console): keep command focus',
        },
      ],
      total: 1,
      byType: [{ type: 'fix', count: 1 }],
    }
    global.fetch = mockJsonFetch(response)

    const storeRef = setupApiStore()
    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getGithubCommits.initiate()
    )

    expect(result.data).toEqual(response)
    const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
    expect(request.url).toMatch(/\/github\/commits$/)
  })

  it('reads API health from /status', async () => {
    const response = {
      status: 'OK',
      service: 'api.sdin.dev',
      version: '1.0.0',
      checkedAt: '2026-08-30T04:00:00.000Z',
      authoredData: { status: 'ready', keys: 12 },
    }
    global.fetch = mockJsonFetch(response)

    const storeRef = setupApiStore()
    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getApiStatus.initiate()
    )

    expect(result.data).toEqual(response)
    const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
    expect(request.url).toMatch(/\/status$/)
  })

  it('rejects an unresponsive GitHub request after the shared timeout', async () => {
    jest.useFakeTimers()
    global.fetch = jest.fn().mockImplementation(
      (request: Request) =>
        new Promise<Response>((_resolve, reject) => {
          request.signal.addEventListener(
            'abort',
            () => reject(new Error('request aborted')),
            { once: true }
          )
        })
    ) as unknown as typeof fetch

    const storeRef = setupApiStore()
    const pending = storeRef.store.dispatch(
      apiSlice.endpoints.getGithubSummary.initiate()
    )

    await jest.advanceTimersByTimeAsync(API_TIMEOUT_MS)
    const result = await pending

    expect(result.error).toMatchObject({ status: 'TIMEOUT_ERROR' })
    pending.unsubscribe()
  })
})
