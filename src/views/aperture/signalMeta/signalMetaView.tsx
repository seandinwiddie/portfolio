import type React from 'react'
import Head from 'expo-router/head'
import type { SignalMetaViewProps } from '../../../features/systems/substrate/ui/presentation/signalMeta/signalMetaSelectors'

/**
 * expo-router manages <title> through react-helmet, which rendered an EMPTY
 * title and overrode the static one in +html.tsx -- every route shipped
 * `<title data-rh="true"></title>`, so tabs, bookmarks and search results all
 * showed the bare URL. Titles have to be supplied through Head to win.
 */
const SignalMeta: React.FC<SignalMetaViewProps> = ({
  fullTitle,
  description,
  routeId,
  schemaVersion,
  robotsPolicy,
  canonicalUrl,
  manifestUrl,
  dataAuthorityUrl,
  documentationUrl,
  sourceUrl,
}) => (
  <Head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <meta name="robots" content={robotsPolicy} />
    <meta name="sdin:route-id" content={routeId} />
    {schemaVersion ? <meta name="sdin:manifest-schema" content={schemaVersion} /> : null}
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
    {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
    {manifestUrl ? (
      <link rel="alternate" type="application/json" href={manifestUrl} />
    ) : null}
    {manifestUrl ? <meta name="sdin:agent-manifest" content={manifestUrl} /> : null}
    {dataAuthorityUrl ? (
      <meta name="sdin:data-authority" content={dataAuthorityUrl} />
    ) : null}
    {documentationUrl ? (
      <meta name="sdin:documentation" content={documentationUrl} />
    ) : null}
    {sourceUrl ? <meta name="sdin:source" content={sourceUrl} /> : null}
  </Head>
)

export default SignalMeta
