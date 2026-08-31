import React from 'react'
import { View } from 'tamagui'
import { useWelcomeRoute } from '../../features/systems/portfolio/profile/welcome/welcomeThunks'
import Welcome from '../portfolio/profile/welcome/welcomeView'
import PageHead from '../shared/pageHead/pageHeadView'

export default function Index() {
  const model = useWelcomeRoute()

  return (
    <View flex={1}>
      <PageHead title="Welcome" />
      <Welcome {...model} />
    </View>
  )
}
