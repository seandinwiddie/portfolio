import type {
  About,
  GithubRepo,
  GithubSummary,
} from '../../../../components/platform/foundation/api/apiTypes'

const YEAR_MS = 31_557_600_000

export interface AboutStatViewModel {
  readonly id: string
  readonly value: string
  readonly label: string
}

export interface AboutRepoViewModel {
  readonly id: string
  readonly name: string
  readonly language: string | null
  readonly htmlUrl: string
}

export interface AboutDomainViewModel {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly detail: string
  readonly indexLabel: string
  readonly meter: string
  readonly className: string
  readonly evidence: readonly AboutRepoViewModel[]
}

export interface AboutLanguageViewModel {
  readonly id: string
  readonly language: string
  readonly count: number
  readonly opacity: number
  readonly percentage: string
}

export interface AboutLanguageSpectrumViewModel {
  readonly meter: string
  readonly languages: readonly AboutLanguageViewModel[]
}

export interface AboutPrincipleViewModel {
  readonly id: string
  readonly title: string
  readonly description: string
}

export interface AboutViewProps {
  readonly intro: Readonly<{
    headline: string
    statement: string
  }> | null
  readonly stats: readonly AboutStatViewModel[]
  readonly domains: readonly AboutDomainViewModel[]
  readonly languageSpectrum: AboutLanguageSpectrumViewModel | null
  readonly principles: readonly AboutPrincipleViewModel[]
  readonly principlesMeter: string
}

const selectEvidence = (
  requestedRepos: readonly string[],
  repos: readonly GithubRepo[]
): readonly AboutRepoViewModel[] =>
  requestedRepos.flatMap((fullName) => {
    const repo = repos.find((candidate) => candidate.fullName === fullName)

    return repo
      ? [{ id: repo.id, name: repo.name, language: repo.language, htmlUrl: repo.htmlUrl }]
      : []
  })

const selectDomains = (
  about: About | null,
  repos: readonly GithubRepo[]
): readonly AboutDomainViewModel[] => {
  const total = about?.domains.length ?? 0

  return (
    about?.domains.map((domain, index) => {
      const indexLabel = String(index + 1).padStart(2, '0')

      return {
        id: domain.id,
        title: domain.title,
        summary: domain.summary,
        detail: domain.detail,
        indexLabel,
        meter: `${indexLabel} / ${String(total).padStart(2, '0')}`,
        className: `stagger-${index + 1}`,
        evidence: selectEvidence(domain.repos, repos),
      }
    }) ?? []
  )
}

const selectStatsAt = (
  now: number,
  summary: GithubSummary | undefined
): readonly AboutStatViewModel[] => {
  const years = summary?.since
    ? Math.floor((now - Date.parse(summary.since)) / YEAR_MS)
    : null

  return summary
    ? [
        ...(years === null
          ? []
          : [{ id: 'years', value: String(years), label: 'years shipping' }]),
        { id: 'repos', value: String(summary.repos.length), label: 'repositories' },
        {
          id: 'languages',
          value: String(summary.languages.length),
          label: 'languages',
        },
        ...(summary.contributions
          ? [
              {
                id: 'contributions',
                value: summary.contributions.total.toLocaleString(),
                label: 'contributions / yr',
              },
            ]
          : []),
      ]
    : []
}

const selectLanguageSpectrum = (
  summary: GithubSummary | undefined
): AboutLanguageSpectrumViewModel | null => {
  const languages = summary?.languages ?? []
  const total = languages.reduce((sum, language) => sum + language.count, 0)

  return total === 0
    ? null
    : {
        meter: `${languages.length} in use`,
        languages: languages.map((language, index) => ({
          id: language.language,
          language: language.language,
          count: language.count,
          opacity: Math.max(0.25, 1 - index * 0.08),
          percentage: `${Math.round((language.count / total) * 100)}%`,
        })),
      }
}

export const selectAboutViewModelAt =
  (now: number) =>
  (about: About | null, summary: GithubSummary | undefined): AboutViewProps => ({
    intro: about ? { headline: about.headline, statement: about.statement } : null,
    stats: selectStatsAt(now, summary),
    domains: selectDomains(about, summary?.repos ?? []),
    languageSpectrum: selectLanguageSpectrum(summary),
    principles:
      about?.principles.map(({ id, title, description }) => ({
        id,
        title,
        description,
      })) ?? [],
    principlesMeter: `${about?.principles.length ?? 0} rules`,
  })
