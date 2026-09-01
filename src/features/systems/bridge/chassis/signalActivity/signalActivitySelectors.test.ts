import { TEST_AMBIENT_SCENE } from '../../../../../test/apiPayload.test.data'
import type { SceneWorld } from '../../../../components/bridge/chassis/ambientScene/ambientSceneTypes'
import type { SignalActivityState } from '../../../../components/bridge/chassis/signalActivity/signalActivityTypes'
import {
  selectSignalActivityCue,
  selectSignalActivityViewModel,
} from './signalActivitySelectors'

const resolved: SignalActivityState = { activeId: 'query-resolve', sequence: 7 }

describe('signalActivity selectors', () => {
  it('projects API-authored visual components into deterministic CSS variables', () => {
    const view = selectSignalActivityViewModel(TEST_AMBIENT_SCENE)(resolved)

    expect(view).toMatchObject({
      id: 'query-resolve',
      sequence: 7,
      className: 'orbital-signal-activity orbital-signal-resolve',
      style: {
        '--signal-activity-duration': '1150ms',
        '--signal-activity-intensity': 0.34,
        '--signal-activity-x': '76%',
        '--signal-activity-y': '28%',
        '--signal-activity-travel': '18vw',
        '--signal-activity-spread': '24vw',
      },
    })
    expect(selectSignalActivityViewModel(TEST_AMBIENT_SCENE)(resolved)).toEqual(view)
  })

  it('projects the matching API-authored acoustic component and fails closed without data', () => {
    const sceneWithoutActivity = {
      ...TEST_AMBIENT_SCENE,
      activity: undefined,
    } as unknown as SceneWorld

    expect(selectSignalActivityCue(TEST_AMBIENT_SCENE)(resolved)).toEqual({
      id: 'query-resolve',
      ...TEST_AMBIENT_SCENE.activity.acoustics['query-resolve'],
    })
    expect(selectSignalActivityCue(null)(resolved)).toBeNull()
    expect(selectSignalActivityCue(sceneWithoutActivity)(resolved)).toBeNull()
    expect(
      selectSignalActivityViewModel(TEST_AMBIENT_SCENE)({ activeId: null, sequence: 0 })
    ).toBeNull()
  })
})
