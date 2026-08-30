import { apiSlice } from '../apiSlice';
import { setupApiStore } from '../../utils/testUtils';
import { mockFailedFetch, mockJsonFetch } from '../../utils/mockFetch';

describe('apiSlice', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes the /data response', async () => {
    const response = {
      brandName: 'Test Brand',
      description: 'Test Description',
      iniTheme: 'light',
      portfolioFeatures: [],
      appProcedures: [],
      themeCustom: { customThemeName: null },
    };

    global.fetch = mockJsonFetch(response);

    const storeRef = setupApiStore(apiSlice);
    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getInitialState.initiate()
    );

    expect(result.data).toMatchObject({
      brandName: 'Test Brand',
      description: 'Test Description',
      iniTheme: 'light',
    });
    // themeCustom + brandNameLoading must survive: themeCustomSlice and bodySlice
    // both match on them.
    expect(result.data).toHaveProperty('themeCustom');
    expect(result.data).toHaveProperty('brandNameLoading');
  });

  it('resolves with bundled data instead of erroring when the API is down', async () => {
    global.fetch = mockFailedFetch();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const storeRef = setupApiStore(apiSlice);
    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getInitialState.initiate()
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.brandName).toBe('Portfolio.sdin.dev');
  });
});
