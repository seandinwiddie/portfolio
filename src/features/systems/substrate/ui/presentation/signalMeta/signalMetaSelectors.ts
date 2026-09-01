import type {
  SignalMetaPresentation,
  StationKey,
} from '../../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeAgentManifestPresentation } from '../../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { AgentSurfaceProjection } from '../../../../../components/substrate/kernel/api/agentSurface/agentSurfaceTypes'
import { projectAgentSurface } from '../../../kernel/api/agentSurface/agentSurfaceSelectors'

export type SignalMetaViewProps = AgentSurfaceProjection & {
  readonly fullTitle: string
  readonly description: string
}

export type SignalMetaViewModel = SignalMetaViewProps

export type SignalMetaSource = Readonly<{
  metadata: SignalMetaPresentation | undefined
  agentManifest: RuntimeAgentManifestPresentation | undefined
}>

const NEUTRAL_SIGNAL_METADATA: SignalMetaPresentation = {
  registryName: 'Orbital Registry',
  titleSuffix: ' · Orbital Registry',
  defaultDescription: 'Interactive system registry.',
  routes: {
    ingress: { title: 'Ingress', description: 'Enter the system registry.' },
    nexus: { title: 'Nexus', description: 'Open the system registry overview.' },
    dossier: { title: 'Dossier', description: 'Review system capabilities.' },
    missions: { title: 'Missions', description: 'Review the active mission record.' },
    telemetry: { title: 'Telemetry', description: 'Inspect live system telemetry.' },
    lostSignal: {
      title: 'Lost Signal',
      description: 'The requested coordinate is unavailable.',
    },
  },
}

export const selectSignalMetaViewModel = (
  source: SignalMetaSource,
  route: StationKey
): SignalMetaViewModel => {
  const selectedMetadata = source.metadata ?? NEUTRAL_SIGNAL_METADATA
  const routeMetadata = selectedMetadata.routes[route]
  const routeTitle = routeMetadata?.title ?? ''
  const fullTitle = routeTitle
    ? `${routeTitle}${selectedMetadata.titleSuffix}`
    : selectedMetadata.registryName

  return {
    fullTitle,
    description: routeMetadata?.description ?? selectedMetadata.defaultDescription,
    ...projectAgentSurface({
      route,
      fullTitle,
      description: routeMetadata?.description ?? selectedMetadata.defaultDescription,
      registryName: selectedMetadata.registryName,
      manifest: source.agentManifest,
    }),
  }
}
