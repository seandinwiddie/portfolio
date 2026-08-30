import { apiSlice } from '../features/api/apiSlice';
import { makeTestStore } from '../features/utils/renderWithProviders';
import { mockFailedFetch, mockJsonFetch } from '../features/utils/mockFetch';

// This suite previously imported `../App`, a module that does not exist in this
// repo, so it could never run. It exercises the documented data flow instead:
// json > api slice > store > feature slices.
describe('Data Flow', () => {
  const payload = {
    brandName: 'Test Brand',
    description: 'Test Description',
    iniTheme: 'light',
    portfolioFeatures: [{ id: '1', title: 'Test Feature', description: 'Test Feature Description' }],
    appProcedures: [{ id: '1', title: 'Test Procedure', description: 'Test Procedure Description' }],
    themeCustom: { customThemeName: null },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fans the /data response out into the brandName, body and nav slices', async () => {
    global.fetch = mockJsonFetch(payload);

    const store = makeTestStore();
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate());

    const state = store.getState();
    expect(state.brandName.value).toBe('Test Brand');
    expect(state.brandName.isLoading).toBe(false);
    expect(state.nav.brandName).toBe('Test Brand');
    expect(state.body.description).toBe('Test Description');
    expect(state.body.portfolioFeatures).toHaveLength(1);
    expect(state.body.appProcedures).toHaveLength(1);
  });

  it('falls back to the bundled initialState.json when the API is unreachable', async () => {
    global.fetch = mockFailedFetch();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const store = makeTestStore();
    await store.dispatch(apiSlice.endpoints.getInitialState.initiate());

    const state = store.getState();
    // The bundled copy still populates the UI rather than leaving a blank page.
    expect(state.body.portfolioFeatures.length).toBeGreaterThan(0);
    expect(state.brandName.value).toBe('Portfolio.sdin.dev');
  });
});
