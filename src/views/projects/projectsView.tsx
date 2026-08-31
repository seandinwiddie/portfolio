import React from 'react'
import { View } from 'tamagui'
import { useProjectsRoute } from '../../features/systems/portfolio/projects/projects/projectsThunks'
import Projects from '../portfolio/projects/projects/projectsView'
import PageHead from '../shared/pageHead/pageHeadView'

export default function ProjectsRoute() {
  const model = useProjectsRoute()

  return (
    <View flex={1}>
      <PageHead
        title="Projects"
        description="Live GitHub projects and activity, updated automatically."
      />
      <Projects {...model} />
    </View>
  )
}
