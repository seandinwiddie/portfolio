import React from 'react'
import { View } from 'tamagui'
import { useMissionsRoute } from '../../features/systems/registry/missions/operations/operationsThunks'
import { useSignalMetaComposition } from '../../features/systems/substrate/ui/presentation/signalMeta/signalMetaThunks'
import Missions from '../registry/missions/missionsView'
import SignalMeta from '../aperture/signalMeta/signalMetaView'

export default function MissionsRoute() {
  const model = useMissionsRoute()
  const signalMeta = useSignalMetaComposition('missions')

  return (
    <View flex={1}>
      <SignalMeta {...signalMeta} />
      <Missions {...model} />
    </View>
  )
}
