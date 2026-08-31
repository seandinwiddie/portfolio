import React from 'react'
import { View } from 'tamagui'
import { selectHomeViewModel } from '../../features/systems/portfolio/profile/home/homeSelectors'
import HomePage from '../portfolio/profile/home/homeView'
import PageHead from '../shared/pageHead/pageHeadView'

export default function Home() {
  const model = selectHomeViewModel()

  return (
    <View flex={1}>
      <PageHead title="Home" description="Sean Dinwiddie's web presences and projects." />
      <HomePage {...model} />
    </View>
  )
}
