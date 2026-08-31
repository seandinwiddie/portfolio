import React from 'react'
import { useNotFoundRoute } from '../../features/systems/portfolio/routing/notFound/notFoundThunks'
import NotFound from '../portfolio/routing/notFound/notFoundView'
import PageHead from '../shared/pageHead/pageHeadView'

export default function NotFoundRoute() {
  const model = useNotFoundRoute()

  return (
    <>
      <PageHead title="Page not found" description="This page does not exist." />
      <NotFound {...model} />
    </>
  )
}
