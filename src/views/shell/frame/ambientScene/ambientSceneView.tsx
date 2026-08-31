import type React from 'react'
import type {
  AmbientSceneViewProps,
  SceneEntityViewProps,
} from '../../../../features/systems/shell/frame/ambientScene/ambientSceneSelectors'

const Entity: React.FC<SceneEntityViewProps> = ({ entity }) =>
  entity ? (
    <span className={entity.className} data-entity={entity.id} style={entity.style} />
  ) : null

/** Decorative scene projected from ECS component tables; hidden from assistive technology. */
const AmbientScene: React.FC<AmbientSceneViewProps> = ({
  visible,
  className,
  archiveOrbit,
  registrySpine,
  pilgrimTransit,
  relayBeacon,
  terminusHorizon,
  surveyMonolith,
}) =>
  visible ? (
    <div className={className} aria-hidden="true">
      <span className="orbital-stars" />
      <Entity entity={archiveOrbit} />
      <Entity entity={registrySpine} />
      <Entity entity={pilgrimTransit} />
      <Entity entity={relayBeacon} />
      <Entity entity={terminusHorizon} />
      <Entity entity={surveyMonolith} />
    </div>
  ) : null

export default AmbientScene
