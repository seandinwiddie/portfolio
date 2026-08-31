import type React from 'react'
import Head from 'expo-router/head'
import { selectPageHeadViewModel } from '../../../features/systems/platform/ui/presentation/pageHead/pageHeadSelectors'
import type { PageHeadViewProps } from '../../../features/systems/platform/ui/presentation/pageHead/pageHeadSelectors'

/**
 * expo-router manages <title> through react-helmet, which rendered an EMPTY
 * title and overrode the static one in +html.tsx -- every route shipped
 * `<title data-rh="true"></title>`, so tabs, bookmarks and search results all
 * showed the bare URL. Titles have to be supplied through Head to win.
 */
const PageHead: React.FC<PageHeadViewProps> = (props) => {
  const { fullTitle, description } = selectPageHeadViewModel(props)

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </Head>
  )
}

export default PageHead
