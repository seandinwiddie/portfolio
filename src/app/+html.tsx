import { ScrollViewStyleReset } from 'expo-router/html'

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
        {/* Title and description are supplied per route by src/components/PageHead
            via expo-router/head. Declaring them here too produced two <title>
            elements in every document. */}

        {/* Pinch-zoom stays enabled: this is a content website, not a native-feeling
            app, and locking maximum-scale blocks users who need to zoom. */}
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, viewport-fit=cover'
        />
        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  )
}

// Mirage is the default theme, so the pre-hydration paint uses its ground
// colour. Anything else flashes white before the theme stylesheet applies.
const responsiveBackground = `
body {
  background-color: #1f2430;
  color: #cbccc6;
}`
