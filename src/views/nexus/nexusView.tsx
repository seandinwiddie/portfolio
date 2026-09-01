import React from 'react'
import { View } from 'tamagui'
import { useNexusRoute } from '../../features/systems/registry/dossier/nexus/nexusThunks'
import { useObservatoryComposition } from '../../features/systems/registry/observatory/signalArray/signalArrayThunks'
import { useSignalMetaComposition } from '../../features/systems/substrate/ui/presentation/signalMeta/signalMetaThunks'
import NexusModule from '../registry/dossier/nexus/nexusView'
import Observatory from '../registry/observatory/signalArray/signalArrayView'
import SignalMeta from '../aperture/signalMeta/signalMetaView'

export default function Nexus() {
  const model = useNexusRoute()
  const observatory = useObservatoryComposition()
  const signalMeta = useSignalMetaComposition('nexus')

  return (
    <View flex={1}>
      <SignalMeta {...signalMeta} />
      <NexusModule {...model} observatory={<Observatory {...observatory} />} />
    </View>
  )
}
