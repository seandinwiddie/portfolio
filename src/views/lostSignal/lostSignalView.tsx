import React from 'react'
import { useLostSignalRoute } from '../../features/systems/registry/wayfinding/lostSignal/lostSignalThunks'
import { useSignalMetaComposition } from '../../features/systems/substrate/ui/presentation/signalMeta/signalMetaThunks'
import LostSignal from '../registry/wayfinding/lostSignal/lostSignalView'
import SignalMeta from '../aperture/signalMeta/signalMetaView'

export default function LostSignalRoute() {
  const model = useLostSignalRoute()
  const signalMeta = useSignalMetaComposition('lostSignal')

  return (
    <>
      <SignalMeta {...signalMeta} />
      <LostSignal {...model} />
    </>
  )
}
