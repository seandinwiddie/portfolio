import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Home from '../Home';

const mockStore = configureStore([]);

describe('Home', () => {
  it('renders portfolio features and app procedures', () => {
    const initialState = {
      body: {
        portfolioFeatures: [
          { id: '1', title: 'Feature 1', description: 'Description 1' },
        ],
        appProcedures: [
          { id: '1', title: 'Procedure 1', description: 'Description 1' },
        ],
      },
    };
    const store = mockStore(initialState);

    const { getByText } = render(
      <Provider store={store}>
        <Home />
      </Provider>
    );

    expect(getByText('Portfolio Features')).toBeInTheDocument();
    expect(getByText('Feature 1')).toBeInTheDocument();
    expect(getByText('App Procedures')).toBeInTheDocument();
    expect(getByText('Procedure 1')).toBeInTheDocument();
  });
});
