import { fromNullable, match, mbind } from 'functional-programming-composition'
import type React from 'react'
import type { SceneWorld } from '../../../../components/bridge/chassis/ambientScene/ambientSceneTypes'
import type {
  SignalActivityId,
  SignalActivityVisualComponent,
  SignalActivityWorld,
  SignalActivityCue,
  SignalActivityState,
} from '../../../../components/bridge/chassis/signalActivity/signalActivityTypes'

export type SignalActivityStyle = React.CSSProperties &
  Record<`--signal-activity-${string}`, string | number>

export type SignalActivityViewProps = {
  readonly id: SignalActivityId
  readonly sequence: number
  readonly className: string
  readonly style: SignalActivityStyle
}

type SignalActivityEntity = {
  readonly id: SignalActivityId
  readonly visual: SignalActivityVisualComponent
  readonly acoustic: SignalActivityCue
}

const selectActiveId =
  (world: SignalActivityWorld) =>
  (state: SignalActivityState): SignalActivityId | null =>
    match(
      mbind(fromNullable(state.activeId), (activeId) =>
        fromNullable(world.ids.find((candidate) => candidate === activeId))
      ),
      (activeId) => activeId,
      () => null
    )

const assembleSignalActivity = (
  world: SignalActivityWorld,
  id: SignalActivityId
): SignalActivityEntity => ({
  id,
  visual: world.visuals[id],
  acoustic: { id, ...world.acoustics[id] },
})

const selectActiveSignalActivity =
  (world: SignalActivityWorld) =>
  (state: SignalActivityState): SignalActivityEntity | null =>
    match(
      fromNullable(selectActiveId(world)(state)),
      (id) => assembleSignalActivity(world, id),
      () => null
    )

const selectSignalActivityStyle = (
  visual: SignalActivityVisualComponent
): SignalActivityStyle => ({
  '--signal-activity-duration': `${visual.durationMs}ms`,
  '--signal-activity-intensity': visual.intensity,
  '--signal-activity-x': `${visual.x}%`,
  '--signal-activity-y': `${visual.y}%`,
  '--signal-activity-rotation': `${visual.rotation}deg`,
  '--signal-activity-travel': `${visual.travelVw}vw`,
  '--signal-activity-spread': `${visual.spreadVw}vw`,
})

export const selectSignalActivityViewModel =
  (world: SceneWorld | null) =>
  (state: SignalActivityState): SignalActivityViewProps | null =>
    match(
      fromNullable(world?.activity),
      (activityWorld) =>
        match(
          fromNullable(selectActiveSignalActivity(activityWorld)(state)),
          (entity) => ({
            id: entity.id,
            sequence: state.sequence,
            className: `orbital-signal-activity orbital-signal-${entity.visual.kind}`,
            style: selectSignalActivityStyle(entity.visual),
          }),
          () => null
        ),
      () => null
    )

export const selectSignalActivityCue =
  (world: SceneWorld | null) =>
  (state: SignalActivityState): SignalActivityCue | null =>
    match(
      fromNullable(world?.activity),
      (activityWorld) =>
        match(
          fromNullable(selectActiveSignalActivity(activityWorld)(state)),
          ({ acoustic }) => acoustic,
          () => null
        ),
      () => null
    )
