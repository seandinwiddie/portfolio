import React from 'react';
import Head from 'expo-router/head';

const SITE_NAME = 'Sean Dinwiddie — Portfolio';

interface PageHeadProps {
  title?: string;
  description?: string;
}

/**
 * expo-router manages <title> through react-helmet, which rendered an EMPTY
 * title and overrode the static one in +html.tsx -- every route shipped
 * `<title data-rh="true"></title>`, so tabs, bookmarks and search results all
 * showed the bare URL. Titles have to be supplied through Head to win.
 */
const PageHead: React.FC<PageHeadProps> = ({ title, description }) => {
  const fullTitle = title ? `${title} — Sean Dinwiddie` : SITE_NAME;
  const desc = description ?? 'Expo Go and RTK Developer — portfolio, projects and experience.';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
    </Head>
  );
};

export default PageHead;
