import type React from 'react'
import type {
  AmbientSceneViewProps,
  SceneEntityViewProps,
} from '../../../../features/systems/bridge/chassis/ambientScene/ambientSceneSelectors'

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
  signalActivity,
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
      {signalActivity ? (
        <span
          key={`${signalActivity.id}:${signalActivity.sequence}`}
          className={signalActivity.className}
          data-signal-activity={signalActivity.id}
          data-signal-sequence={signalActivity.sequence}
          style={signalActivity.style}
        />
      ) : null}
    </div>
  ) : null

export default AmbientScene
