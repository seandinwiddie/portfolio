import { ScrollViewStyleReset } from 'expo-router/html'
import { selectThemeBootViewModel } from '../../features/entities/bridge/spectrum/themeSelection/themeSelectionSelectors'

const themeBoot = selectThemeBootViewModel()

// This file is web-only and used to configure the root HTML for every
// web document during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={themeBoot.defaultClassName}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* Title and description are supplied per route by the signalMeta view
            via expo-router/head. Declaring them here too produced two <title>
            elements in every document. */}

        {/* Pinch-zoom stays enabled: this registry must remain magnifiable, and
            locking maximum-scale blocks users who need to zoom. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* The selector projects all built-in boot colors and a storage-safe
            class installer so a remembered theme paints before hydration. */}
        <style dangerouslySetInnerHTML={{ __html: themeBoot.stylesheet }} />
        <script dangerouslySetInnerHTML={{ __html: themeBoot.script }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  )
}
