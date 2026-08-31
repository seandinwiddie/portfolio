export type PageHeadViewProps = {
  readonly title?: string
  readonly description?: string
}

export type PageHeadViewModel = {
  readonly fullTitle: string
  readonly description: string
}

const SITE_NAME = 'Sean Dinwiddie — Portfolio'
const SITE_DESCRIPTION =
  'AI systems architect and full-stack engineer — selected work, live projects, and system design.'

export const selectPageHeadViewModel = ({
  title,
  description,
}: PageHeadViewProps): PageHeadViewModel => ({
  fullTitle: title ? `${title} — Sean Dinwiddie` : SITE_NAME,
  description: description ?? SITE_DESCRIPTION,
})
