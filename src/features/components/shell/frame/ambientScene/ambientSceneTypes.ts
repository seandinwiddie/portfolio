export type SceneEntityId =
  | 'archive-orbit'
  | 'registry-spine'
  | 'pilgrim-transit'
  | 'relay-beacon'
  | 'terminus-horizon'
  | 'survey-monolith'

export type SceneKind = 'orbit' | 'spine' | 'transit' | 'beacon' | 'horizon' | 'monolith'

export type ScenePriority = 'essential' | 'atmospheric'

export type PositionComponent = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly rotation: number
  readonly depth: number
}

export type VisualComponent = {
  readonly kind: SceneKind
  readonly priority: ScenePriority
  readonly label: string
}

export type MotionComponent = {
  readonly duration: number
  readonly delay: number
  readonly drift: number
}

export type SceneEntity = {
  readonly id: SceneEntityId
  readonly position: PositionComponent
  readonly visual: VisualComponent
  readonly motion: MotionComponent
}

export type SceneWorld = {
  readonly ids: readonly SceneEntityId[]
  readonly positions: Readonly<Record<SceneEntityId, PositionComponent>>
  readonly visuals: Readonly<Record<SceneEntityId, VisualComponent>>
  readonly motions: Readonly<Record<SceneEntityId, MotionComponent>>
}

export type AmbientSceneLoadState = 'pending' | 'ready' | 'error'

export type AmbientSceneState = {
  readonly world: SceneWorld | null
  readonly loadState: AmbientSceneLoadState
}
