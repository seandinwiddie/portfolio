import type {
  SignalMetaPresentation,
  StationKey,
} from '../../../../../components/substrate/kernel/api/apiTypes'

export type SignalMetaViewProps = {
  readonly fullTitle: string
  readonly description: string
}

export type SignalMetaViewModel = SignalMetaViewProps

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
  metadata: SignalMetaPresentation | undefined,
  route: StationKey
): SignalMetaViewModel => {
  const selectedMetadata = metadata ?? NEUTRAL_SIGNAL_METADATA
  const routeMetadata = selectedMetadata.routes[route]
  const routeTitle = routeMetadata?.title ?? ''

  return {
    fullTitle: routeTitle
      ? `${routeTitle}${selectedMetadata.titleSuffix}`
      : selectedMetadata.registryName,
    description: routeMetadata?.description ?? selectedMetadata.defaultDescription,
  }
}
