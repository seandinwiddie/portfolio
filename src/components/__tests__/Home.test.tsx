import React from 'react';
import Home from '../Home';
import { makeTestStore, renderWithProviders } from '../../features/utils/renderWithProviders';

describe('Home', () => {
  it('renders portfolio features and app procedures', () => {
    const store = makeTestStore({
      body: {
        portfolioFeatures: [{ id: '1', title: 'Feature 1', description: 'Description 1' }],
        appProcedures: [{ id: '1', title: 'Procedure 1', description: 'Description 1' }],
        brandName: '',
        description: '',
        brandNameLoading: { isLoading: false },
      },
    });

    const { getByText } = renderWithProviders(<Home />, { store });

    expect(getByText('Portfolio Features')).toBeTruthy();
    expect(getByText('Feature 1')).toBeTruthy();
    expect(getByText('App Procedures')).toBeTruthy();
    expect(getByText('Procedure 1')).toBeTruthy();
  });

  it('renders empty-state copy when the store has no content', () => {
    const store = makeTestStore({
      body: {
        portfolioFeatures: [],
        appProcedures: [],
        brandName: '',
        description: '',
        brandNameLoading: { isLoading: false },
      },
    });

    const { getByText } = renderWithProviders(<Home />, { store });

    expect(getByText('No portfolio features available')).toBeTruthy();
    expect(getByText('No app procedures available')).toBeTruthy();
  });
});
