# Portfolio App

This is a React Native portfolio application built with Expo, Redux Toolkit, and Tamagui.

## Features

- Dynamic theme switching (light, dark, and system)
- Responsive design for various screen sizes
- Redux state management
- API integration with RTK Query

## Project Structure

- `src/`: Source code
  - `app/`: Main application files
  - `components/`: Reusable React components
  - `features/`: Redux slices and API
  - `data/`: Initial state and mock data

## Technologies Used

- React Native
- Expo
- Redux Toolkit
- Tamagui
- TypeScript

## Getting Started

```bash
yarn install
yarn web        # dev server
yarn test       # jest
yarn typecheck  # tsc --noEmit
yarn lint       # biome
yarn vercel-build   # static web export to dist/
```

The app reads its content from `https://api.sdin.dev/data`. Set
`EXPO_PUBLIC_API_URL` to point at a different API. If the API is unreachable the
app falls back to the bundled `src/data/initialState.json`, so it still renders.

## Configuration

The project uses various configuration files:

- `app.json`: Expo configuration
- `tsconfig.json`: TypeScript configuration
- `metro.config.js`: Metro bundler configuration
- `tamagui.config.ts`: Tamagui theme, token and animation configuration
- `biome.json`: linter and formatter rules

## Routing

Routes live in `src/app/`. **Only route files belong there** -- every file in that
directory becomes a public URL. Shared store wiring lives in `src/store/`.
