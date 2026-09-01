import type { GithubSummary } from '../../../../components/substrate/kernel/api/apiTypes'
import type { MissionsPresentation } from '../../../../components/registry/missions/operations/operationsTypes'
import type { RuntimeSignalLatticePresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { ThemeVisualization } from '../../../../../styles/themes/themeTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'
import {
  selectSignalLatticeViewModel,
  type SignalLatticeViewProps,
} from './signalLattice/signalLatticeSelectors'
import {
  selectMissionDegradedMessage,
  type MissionsSourceInput,
} from './provenance/provenanceSelectors'
import {
  selectActivityLabel,
  selectCommitKind,
  selectRelativeAgeAt,
  selectRepositoryAt,
} from './copy/copySelectors'

const MAX_ACTIVITY_KINDS = 7
const MAX_ACTIVITY_REPOSITORIES = 7
const MAX_LANGUAGES = 7
const MAX_OWNERS = 5
const MAX_REPOSITORIES_PER_OWNER = 7

export interface MissionStatViewModel {
  readonly id: string
  readonly value: string
  readonly label: string
}

export interface MissionLanguageViewModel {
  readonly id: string
  readonly language: string
  readonly detail: string
}

export interface MissionActivityKindViewModel {
  readonly id: string
  readonly label: string
  readonly count: string
}

export interface MissionActivityRepoViewModel {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly detail: string
}

export interface MissionActivityViewModel {
  readonly label: string
  readonly meter: string
  readonly kinds: readonly MissionActivityKindViewModel[]
  readonly repos: readonly MissionActivityRepoViewModel[]
  readonly summary: string | null
}

export interface MissionCommitViewModel {
  readonly id: string
  readonly sha: string
  readonly repo: string
  readonly url: string
  readonly age: string
  readonly subject: string
  readonly kind: string
}

export interface MissionCommitArchiveViewModel {
  readonly label: string
  readonly meter: string
  readonly commits: readonly MissionCommitViewModel[]
}

export interface MissionLanguagesViewProps {
  readonly label: string
  readonly meter: string
  readonly languages: readonly MissionLanguageViewModel[]
}

export interface MissionRepoViewModel {
  readonly id: string
  readonly name: string
  readonly htmlUrl: string
  readonly language: string | null
  readonly starsLabel: string | null
  readonly description: string | null
  readonly updatedLabel: string
}

export interface MissionOwnerViewModel {
  readonly id: string
  readonly label: string
  readonly meter: string
  readonly repos: readonly MissionRepoViewModel[]
}

export interface MissionOwnersViewProps {
  readonly owners: readonly MissionOwnerViewModel[]
}

export interface MissionsDataViewModel {
  readonly stats: readonly MissionStatViewModel[]
  readonly contributionMeter: string | null
  readonly contributionLabel: string
  readonly signalLattice: SignalLatticeViewProps | null
  readonly commits: MissionCommitArchiveViewModel | null
  readonly activity: MissionActivityViewModel
  readonly languagesLabel: string
  readonly languagesMeter: string
  readonly languages: readonly MissionLanguageViewModel[]
  readonly owners: readonly MissionOwnerViewModel[]
}

export interface MissionsViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly available: boolean
  readonly eyebrow: string
  readonly headline: string
  readonly statement: string
  readonly loadingLabel: string
  readonly errorLabel: string
  readonly isLoading: boolean
  readonly isError: boolean
  readonly degradedMessage: string | null
  readonly data: MissionsDataViewModel | null
}

export const selectMissionsViewModelAt =
  (now: number) =>
  (
    presentation: MissionsPresentation | undefined,
    signalLatticePresentation: RuntimeSignalLatticePresentation | undefined
  ) =>
  (source: MissionsSourceInput): Omit<MissionsViewProps, 'dataStatus'> => {
    const { summary, visualization } = source
    const copy = presentation?.copy
    const languageTotal =
      summary?.languages.reduce((total, language) => total + language.count, 0) ?? 0
    const commits = summary?.commits?.commits.length
      ? {
          label: presentation?.panels.recorder ?? '',
          meter: copy
            ? `${summary.commits.total.toLocaleString()} ${copy.indexedUnit}`
            : '',
          commits: summary.commits.commits.slice(0, 8).map((commit) => ({
            id: `${commit.repo}-${commit.sha}`,
            sha: commit.sha,
            repo: commit.repo,
            url: commit.url,
            age: copy ? selectRelativeAgeAt(now)(copy)(commit.at) : '',
            subject: commit.subject,
            kind: copy ? selectCommitKind(copy)(commit) : '',
          })),
        }
      : null

    return {
      available: Boolean(presentation),
      eyebrow: presentation?.eyebrow ?? '',
      headline: presentation?.headline ?? '',
      statement: presentation?.statement ?? '',
      loadingLabel: presentation?.loadingLabel ?? '',
      errorLabel: presentation?.errorLabel ?? '',
      isLoading: false,
      isError: false,
      degradedMessage: selectMissionDegradedMessage(presentation)(source),
      data:
        summary && presentation
          ? {
              stats: [
                {
                  id: 'repos',
                  value: String(summary.repos.length),
                  label: presentation.metrics.repositories,
                },
                {
                  id: 'languages',
                  value: String(summary.languages.length),
                  label: presentation.metrics.languages,
                },
                {
                  id: 'events',
                  value: String(summary.activity.total),
                  label: presentation.metrics.events,
                },
                {
                  id: 'followers',
                  value: String(summary.profile.followers),
                  label: presentation.metrics.followers,
                },
              ],
              contributionMeter: summary.contributions
                ? `${summary.contributions.total.toLocaleString()} ${presentation.copy.annualUnit}`
                : null,
              contributionLabel: presentation.panels.contributions,
              signalLattice:
                summary.contributions && signalLatticePresentation
                  ? selectSignalLatticeViewModel(
                      summary.contributions,
                      visualization
                    )(signalLatticePresentation)
                  : null,
              commits,
              activity: {
                label: presentation.panels.activity,
                meter: `${summary.activity.total} ${presentation.copy.eventsUnit}`,
                kinds: summary.activity.byKind
                  .slice(0, MAX_ACTIVITY_KINDS)
                  .map(({ kind, count }) => ({
                    id: kind,
                    label: selectActivityLabel(presentation.copy)(kind, count),
                    count: String(count),
                  })),
                repos: summary.activity.byRepo
                  .map(({ repo, count }) => {
                    const target = summary.repos.find(({ fullName }) => fullName === repo)
                    return target
                      ? {
                          id: repo,
                          label: repo,
                          href: target.htmlUrl,
                          detail: `${count} ${presentation.copy.eventsUnit}`,
                        }
                      : null
                  })
                  .filter((repo): repo is MissionActivityRepoViewModel => repo !== null)
                  .slice(0, MAX_ACTIVITY_REPOSITORIES),
                summary: summary.activity.since
                  ? `${summary.activity.total} ${presentation.copy.publicEventsPrefix} ${selectRelativeAgeAt(now)(presentation.copy)(summary.activity.since)}`
                  : null,
              },
              languagesLabel: presentation.panels.languages,
              languagesMeter: `${summary.languages.length} ${presentation.copy.inUseUnit}`,
              languages: summary.languages
                .slice(0, MAX_LANGUAGES)
                .map(({ language, count }) => ({
                  id: language,
                  language,
                  detail: `${count} · ${Math.round((count / languageTotal) * 100)}%`,
                })),
              owners: summary.owners.slice(0, MAX_OWNERS).map((owner) => ({
                id: owner.owner,
                label: owner.owner,
                meter: `${owner.count} ${presentation.copy.repositoriesUnit}`,
                repos: summary.repos
                  .filter((repo) => repo.owner === owner.owner)
                  .slice(0, MAX_REPOSITORIES_PER_OWNER)
                  .map(selectRepositoryAt(now)(presentation.copy)),
              })),
            }
          : null,
    }
  }
