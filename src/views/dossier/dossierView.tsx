import React from 'react'
import { View } from 'tamagui'
import { useDossierRoute } from '../../features/systems/registry/dossier/manifest/manifestThunks'
import { useSignalMetaComposition } from '../../features/systems/substrate/ui/presentation/signalMeta/signalMetaThunks'
import Dossier from '../registry/dossier/manifest/manifestView'
import SignalMeta from '../aperture/signalMeta/signalMetaView'

export default function DossierStation() {
  const model = useDossierRoute()
  const signalMeta = useSignalMetaComposition('dossier')

  return (
    <View flex={1}>
      <SignalMeta {...signalMeta} />
      <Dossier {...model} />
    </View>
  )
}
