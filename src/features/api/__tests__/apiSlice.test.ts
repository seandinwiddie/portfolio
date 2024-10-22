import { apiSlice } from '../apiSlice';
import { setupApiStore } from '../../utils/testUtils';

describe('apiSlice', () => {
  const storeRef = setupApiStore(apiSlice);

  it('fetches initial state', async () => {
    const initialState = {
      brandName: 'Test Brand',
      description: 'Test Description',
      iniTheme: 'light',
      portfolioFeatures: [],
      appProcedures: [],
    };

    // Mock the fetch function
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => initialState,
    });

    const result = await storeRef.store.dispatch(
      apiSlice.endpoints.getInitialState.initiate()
    );

    expect(result.data).toEqual(initialState);
  });
});
