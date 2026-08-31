import type { InitialStateResponse } from '../features/components/platform/foundation/api/apiTypes'
import type { SceneWorld } from '../features/components/shell/frame/ambientScene/ambientSceneTypes'

export const TEST_AMBIENT_SCENE: SceneWorld = {
  ids: [
    'archive-orbit',
    'registry-spine',
    'pilgrim-transit',
    'relay-beacon',
    'terminus-horizon',
    'survey-monolith',
  ],
  positions: {
    'archive-orbit': { x: 68, y: 7, width: 34, height: 34, rotation: -14, depth: 1 },
    'registry-spine': { x: 5, y: 12, width: 7, height: 70, rotation: 0, depth: 2 },
    'pilgrim-transit': { x: 72, y: 73, width: 22, height: 2, rotation: -8, depth: 3 },
    'relay-beacon': { x: 89, y: 43, width: 2, height: 2, rotation: 0, depth: 4 },
    'terminus-horizon': { x: 10, y: 88, width: 80, height: 1, rotation: 0, depth: 1 },
    'survey-monolith': { x: 80, y: 18, width: 4, height: 22, rotation: 0, depth: 2 },
  },
  visuals: {
    'archive-orbit': { kind: 'orbit', priority: 'essential', label: 'Test orbit' },
    'registry-spine': { kind: 'spine', priority: 'essential', label: 'Test spine' },
    'pilgrim-transit': {
      kind: 'transit',
      priority: 'atmospheric',
      label: 'Test transit',
    },
    'relay-beacon': { kind: 'beacon', priority: 'atmospheric', label: 'Test beacon' },
    'terminus-horizon': { kind: 'horizon', priority: 'essential', label: 'Test horizon' },
    'survey-monolith': {
      kind: 'monolith',
      priority: 'atmospheric',
      label: 'Test monolith',
    },
  },
  motions: {
    'archive-orbit': { duration: 38, delay: 0, drift: 8 },
    'registry-spine': { duration: 18, delay: 2, drift: 2 },
    'pilgrim-transit': { duration: 14, delay: 4, drift: 18 },
    'relay-beacon': { duration: 5, delay: 1, drift: 0 },
    'terminus-horizon': { duration: 24, delay: 0, drift: 3 },
    'survey-monolith': { duration: 28, delay: 5, drift: 5 },
  },
}

export const TEST_INITIAL_STATE: InitialStateResponse = {
  brandName: 'Test Brand',
  description: 'Test Description',
  iniTheme: 'light',
  portfolioFeatures: [
    { id: '1', title: 'Test Feature', description: 'Test Feature Description' },
  ],
  appProcedures: [
    { id: '1', title: 'Test Procedure', description: 'Test Procedure Description' },
  ],
  themeCustom: { customThemeName: null },
  brandNameLoading: { isLoading: true },
  about: null,
  ambientScene: TEST_AMBIENT_SCENE,
}
