import React from 'react'
import { View } from 'tamagui'
import { useAboutRoute } from '../../features/systems/portfolio/profile/about/aboutThunks'
import About from '../portfolio/profile/about/aboutView'
import PageHead from '../shared/pageHead/pageHeadView'

export default function AboutPage() {
  const model = useAboutRoute()

  return (
    <View flex={1}>
      <PageHead
        title="About"
        description="What I build, and the repositories that evidence it."
      />
      <About {...model} />
    </View>
  )
}
