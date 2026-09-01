import { View } from 'tamagui'
import { useTelemetryRoute } from '../../features/systems/registry/telemetry/diagnostics/diagnosticsThunks'
import { useSignalMetaComposition } from '../../features/systems/substrate/ui/presentation/signalMeta/signalMetaThunks'
import Telemetry from '../registry/telemetry/diagnostics/diagnosticsView'
import SignalMeta from '../aperture/signalMeta/signalMetaView'

const TelemetryContent = () => {
  const model = useTelemetryRoute()

  return <Telemetry {...model} />
}

export default function TelemetryStation() {
  const signalMeta = useSignalMetaComposition('telemetry')

  return (
    <View flex={1}>
      <SignalMeta {...signalMeta} />
      <TelemetryContent />
    </View>
  )
}
