import React from 'react'
import { View } from 'tamagui'
import { useIngressRoute } from '../../features/systems/registry/dossier/ingress/ingressThunks'
import { useSignalMetaComposition } from '../../features/systems/substrate/ui/presentation/signalMeta/signalMetaThunks'
import Ingress from '../registry/dossier/ingress/ingressView'
import SignalMeta from '../aperture/signalMeta/signalMetaView'

export default function IngressStation() {
  const model = useIngressRoute()
  const signalMeta = useSignalMetaComposition('ingress')

  return (
    <View flex={1}>
      <SignalMeta {...signalMeta} />
      <Ingress {...model} />
    </View>
  )
}
