import AsyncStorage from '@react-native-async-storage/async-storage'
import { makeTestStore } from '../../../../../test/providers.test.helper'
import { TEST_AMBIENT_SCENE } from '../../../../../test/apiPayload.test.data'
import { selectSceneEntities } from '../../../../systems/shell/frame/ambientScene/ambientSceneSelectors'
import { restoreExperience } from '../../../../systems/shell/controls/experience/experienceThunks'
import { experienceModeCycled } from './experienceActions'
import { selectExperienceMode } from './experienceSelectors'
import reducer from './experienceSlice'

describe('experience slice and scene projection', () => {
  afterEach(async () => {
    await AsyncStorage.clear()
  })

  it('cycles between cinematic and quiet modes as an event transition', () => {
    const quiet = reducer(undefined, experienceModeCycled())
    const cinematic = reducer(quiet, experienceModeCycled())

    expect(selectExperienceMode({ experience: quiet })).toBe('quiet')
    expect(selectExperienceMode({ experience: cinematic })).toBe('cinematic')
  })

  it('projects atmospheric ECS entities only in cinematic mode', () => {
    const cinematic = selectSceneEntities(TEST_AMBIENT_SCENE, 'cinematic')
    const quiet = selectSceneEntities(TEST_AMBIENT_SCENE, 'quiet')

    expect(cinematic).toHaveLength(6)
    expect(quiet).toHaveLength(3)
    expect(quiet.every((entity) => entity.visual.priority === 'essential')).toBe(true)
  })

  it('translates restored boundary data into the core experience event', async () => {
    await AsyncStorage.setItem('portfolio.experienceMode', 'quiet')
    const store = makeTestStore()

    await store.dispatch(restoreExperience())

    expect(selectExperienceMode(store.getState())).toBe('quiet')
  })
})
