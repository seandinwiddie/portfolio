import type React from 'react'
import type {
  SceneEntity,
  SceneEntityId,
  SceneWorld,
} from '../../../../components/bridge/chassis/ambientScene/ambientSceneTypes'

export type SceneStyle = React.CSSProperties &
  Record<`--scene-${string}`, string | number>

export type SceneEntityViewModel = {
  readonly id: SceneEntityId
  readonly className: string
  readonly style: SceneStyle
}

export type SceneEntityViewProps = {
  readonly entity: SceneEntityViewModel | null
}

export type AmbientSceneViewProps = {
  readonly visible: boolean
  readonly className: string
  readonly archiveOrbit: SceneEntityViewModel | null
  readonly registrySpine: SceneEntityViewModel | null
  readonly pilgrimTransit: SceneEntityViewModel | null
  readonly relayBeacon: SceneEntityViewModel | null
  readonly terminusHorizon: SceneEntityViewModel | null
  readonly surveyMonolith: SceneEntityViewModel | null
}

const assembleEntity = (world: SceneWorld, id: SceneEntityId): SceneEntity => ({
  id,
  position: world.positions[id],
  visual: world.visuals[id],
  motion: world.motions[id],
})

export const selectSceneEntities = (world: SceneWorld): readonly SceneEntity[] =>
  world.ids.map((id) => assembleEntity(world, id))

const selectSceneStyle = ({ position, motion }: SceneEntity): SceneStyle => ({
  '--scene-x': `${position.x}%`,
  '--scene-y': `${position.y}%`,
  '--scene-width': `${position.width}vw`,
  '--scene-height': `${position.height}vw`,
  '--scene-rotation': `${position.rotation}deg`,
  '--scene-depth': position.depth,
  '--scene-duration': `${motion.duration}s`,
  '--scene-delay': `${motion.delay}s`,
  '--scene-drift': `${motion.drift}px`,
})

const selectEntityViewModel = (entity: SceneEntity): SceneEntityViewModel => ({
  id: entity.id,
  className: `orbital-entity orbital-${entity.visual.kind}`,
  style: selectSceneStyle(entity),
})

const selectOptionalEntityById = (
  entities: readonly SceneEntity[],
  id: SceneEntityId
): SceneEntityViewModel | null => {
  const entity = entities.find((candidate) => candidate.id === id)
  return entity ? selectEntityViewModel(entity) : null
}

export const selectAmbientSceneViewModel = (
  world: SceneWorld | null,
  visible: boolean
): AmbientSceneViewProps => {
  const entities = world ? selectSceneEntities(world) : []
  return {
    visible: visible && Boolean(world),
    className: 'orbital-scene orbital-scene-cinematic',
    archiveOrbit: selectOptionalEntityById(entities, 'archive-orbit'),
    registrySpine: selectOptionalEntityById(entities, 'registry-spine'),
    pilgrimTransit: selectOptionalEntityById(entities, 'pilgrim-transit'),
    relayBeacon: selectOptionalEntityById(entities, 'relay-beacon'),
    terminusHorizon: selectOptionalEntityById(entities, 'terminus-horizon'),
    surveyMonolith: selectOptionalEntityById(entities, 'survey-monolith'),
  }
}
