import React from 'react'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { TamaguiProvider } from 'tamagui'
import config from '../../tamagui.config'
import { makeStore, type AppState } from '../store'

export const makeTestStore = (preloadedState?: Partial<AppState>) =>
  makeStore({ preloadedState, autoBatch: false })

const TestProvider = Provider as React.ComponentType<
  React.PropsWithChildren<{ store: ReturnType<typeof makeTestStore> }>
>

export const renderWithProviders = (
  ui: React.ReactElement,
  { store = makeTestStore() } = {}
) => ({
  store,
  ...render(
    React.createElement(
      TamaguiProvider,
      { config, defaultTheme: 'light' },
      React.createElement(TestProvider, { store }, ui)
    )
  ),
})
