/**
 * Metro implements `require.context` (Expo enables it by default), but the Node
 * typings do not know about it, so the theme-selection catalog discovery
 * failed to typecheck.
 */
interface MetroRequireContext {
  (id: string): unknown
  keys(): string[]
  resolve(id: string): string
  id: string
}

declare global {
  interface NodeRequire {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp,
      mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once'
    ): MetroRequireContext
  }
}

export {}
