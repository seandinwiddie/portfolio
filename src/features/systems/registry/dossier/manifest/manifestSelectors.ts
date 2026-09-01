import type {
  Dossier,
  GithubRepo,
  GithubSummary,
} from '../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeDossierPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'

const YEAR_MS = 31_557_600_000

export interface DossierStatViewModel {
  readonly id: string
  readonly value: string
  readonly label: string
}

export interface DossierRepoViewModel {
  readonly id: string
  readonly name: string
  readonly language: string | null
  readonly htmlUrl: string
}

export interface DossierDomainViewModel {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly detail: string
  readonly indexLabel: string
  readonly meter: string
  readonly className: string
  readonly evidence: readonly DossierRepoViewModel[]
  readonly evidenceLabel: string
}

export interface DossierLanguageViewModel {
  readonly id: string
  readonly language: string
  readonly count: number
  readonly opacity: number
  readonly percentage: string
}

export interface DossierLanguageSpectrumViewModel {
  readonly label: string
  readonly meter: string
  readonly languages: readonly DossierLanguageViewModel[]
}

export interface DossierPrincipleViewModel {
  readonly id: string
  readonly title: string
  readonly description: string
}

export interface DossierViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly intro: Readonly<{
    headline: string
    statement: string
  }> | null
  readonly stats: readonly DossierStatViewModel[]
  readonly domains: readonly DossierDomainViewModel[]
  readonly languageSpectrum: DossierLanguageSpectrumViewModel | null
  readonly principles: readonly DossierPrincipleViewModel[]
  readonly principlesMeter: string
  readonly principlesLabel: string
  readonly eyebrow: string
}

const selectEvidence = (
  requestedRepos: readonly string[],
  repos: readonly GithubRepo[]
): readonly DossierRepoViewModel[] =>
  requestedRepos.flatMap((fullName) => {
    const repo = repos.find((candidate) => candidate.fullName === fullName)

    return repo
      ? [{ id: repo.id, name: repo.name, language: repo.language, htmlUrl: repo.htmlUrl }]
      : []
  })

const selectDomains =
  (dossier: Dossier | null, repos: readonly GithubRepo[]) =>
  (
    presentation: RuntimeDossierPresentation | undefined
  ): readonly DossierDomainViewModel[] => {
    const total = dossier?.domains.length ?? 0

    return (
      dossier?.domains.map((domain, index) => {
        const indexLabel = String(index + 1).padStart(2, '0')

        return {
          id: domain.id,
          title: domain.title,
          summary: domain.summary,
          detail: domain.detail,
          indexLabel,
          meter: `${indexLabel} / ${String(total).padStart(2, '0')}`,
          className: `stagger-${index + 1}`,
          evidenceLabel: presentation?.evidenceLabel ?? '',
          evidence: selectEvidence(domain.repos, repos),
        }
      }) ?? []
    )
  }

const selectStatsAt =
  (now: number, summary: GithubSummary | undefined) =>
  (
    presentation: RuntimeDossierPresentation | undefined
  ): readonly DossierStatViewModel[] => {
    const years = summary?.since
      ? Math.floor((now - Date.parse(summary.since)) / YEAR_MS)
      : null

    return summary
      ? [
          ...(years === null
            ? []
            : [
                {
                  id: 'years',
                  value: String(years),
                  label: presentation?.stats.years ?? '',
                },
              ]),
          {
            id: 'repos',
            value: String(summary.repos.length),
            label: presentation?.stats.repositories ?? '',
          },
          {
            id: 'languages',
            value: String(summary.languages.length),
            label: presentation?.stats.languages ?? '',
          },
          ...(summary.contributions
            ? [
                {
                  id: 'contributions',
                  value: summary.contributions.total.toLocaleString(),
                  label: presentation?.stats.contributions ?? '',
                },
              ]
            : []),
        ]
      : []
  }

const selectLanguageSpectrum = (
  summary: GithubSummary | undefined,
  presentation: RuntimeDossierPresentation | undefined
): DossierLanguageSpectrumViewModel | null => {
  const languages = summary?.languages ?? []
  const total = languages.reduce((sum, language) => sum + language.count, 0)

  return total === 0
    ? null
    : {
        label: presentation?.languageRangeLabel ?? '',
        meter: `${languages.length} ${presentation?.meters.languages ?? ''}`.trim(),
        languages: languages.map((language, index) => ({
          id: language.language,
          language: language.language,
          count: language.count,
          opacity: Math.max(0.25, 1 - index * 0.08),
          percentage: `${Math.round((language.count / total) * 100)}%`,
        })),
      }
}

export const selectDossierViewModelAt =
  (now: number) =>
  (presentation: RuntimeDossierPresentation | undefined) =>
  (
    dossier: Dossier | null,
    summary: GithubSummary | undefined
  ): Omit<DossierViewProps, 'dataStatus'> => ({
    intro: dossier ? { headline: dossier.headline, statement: dossier.statement } : null,
    stats: selectStatsAt(now, summary)(presentation),
    domains: selectDomains(dossier, summary?.repos ?? [])(presentation),
    languageSpectrum: selectLanguageSpectrum(summary, presentation),
    principles:
      dossier?.principles.map(({ id, title, description }) => ({
        id,
        title,
        description,
      })) ?? [],
    principlesMeter:
      `${dossier?.principles.length ?? 0} ${presentation?.meters.principles ?? ''}`.trim(),
    principlesLabel: presentation?.principlesLabel ?? '',
    eyebrow: presentation?.eyebrow ?? '',
  })
