import type React from 'react'
import Head from 'expo-router/head'
import type { SignalMetaViewProps } from '../../../features/systems/substrate/ui/presentation/signalMeta/signalMetaSelectors'

/**
 * expo-router manages <title> through react-helmet, which rendered an EMPTY
 * title and overrode the static one in +html.tsx -- every route shipped
 * `<title data-rh="true"></title>`, so tabs, bookmarks and search results all
 * showed the bare URL. Titles have to be supplied through Head to win.
 */
const SignalMeta: React.FC<SignalMetaViewProps> = ({ fullTitle, description }) => (
  <Head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
  </Head>
)

export default SignalMeta
