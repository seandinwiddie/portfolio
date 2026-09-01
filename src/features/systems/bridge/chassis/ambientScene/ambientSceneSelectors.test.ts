import { TEST_AMBIENT_SCENE } from '../../../../../test/apiPayload.test.data'
import { selectAmbientSceneViewModel, selectSceneEntities } from './ambientSceneSelectors'

describe('always-cinematic ambient scene projection', () => {
  it('projects every API-authored ECS entity', () => {
    expect(selectSceneEntities(TEST_AMBIENT_SCENE)).toHaveLength(6)
  })

  it('keeps the scene visible without an in-app FX-off mode', () => {
    const model = selectAmbientSceneViewModel(TEST_AMBIENT_SCENE, true)

    expect(model.visible).toBe(true)
    expect(model.className).toContain('cinematic')
    expect(model.pilgrimTransit).not.toBeNull()
    expect(model.surveyMonolith).not.toBeNull()
  })
})
