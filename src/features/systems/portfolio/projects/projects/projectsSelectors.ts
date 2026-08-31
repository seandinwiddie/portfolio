import type {
  GithubCommit,
  GithubRepo,
  GithubSummary,
} from '../../../../components/platform/foundation/api/apiTypes'
import type { ThemeVisualization } from '../../../../../styles/themes/themeTypes'
import {
  selectContributionGraphViewModel,
  type ContributionGraphViewProps,
} from './contributionGraph/contributionGraphSelectors'

const DAY_MS = 86_400_000

const ACTIVITY_INFLECTIONS: Readonly<Record<string, readonly [string, string]>> = {
  push: ['push', 'pushes'],
  issue: ['issue', 'issues'],
  pull_request: ['pull request', 'pull requests'],
  issue_comment: ['issue comment', 'issue comments'],
}

export interface ProjectStatViewModel {
  readonly id: string
  readonly value: string
  readonly label: string
}

export interface ProjectLanguageViewModel {
  readonly id: string
  readonly language: string
  readonly detail: string
}

export interface ProjectActivityKindViewModel {
  readonly id: string
  readonly label: string
  readonly count: string
}

export interface ProjectActivityRepoViewModel {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly detail: string
}

export interface ProjectActivityViewModel {
  readonly meter: string
  readonly kinds: readonly ProjectActivityKindViewModel[]
  readonly repos: readonly ProjectActivityRepoViewModel[]
  readonly summary: string | null
}

export interface ProjectCommitViewModel {
  readonly id: string
  readonly sha: string
  readonly repo: string
  readonly url: string
  readonly age: string
  readonly subject: string
  readonly kind: string
}

export interface ProjectCommitArchiveViewModel {
  readonly meter: string
  readonly commits: readonly ProjectCommitViewModel[]
}

export interface ProjectLanguagesViewProps {
  readonly meter: string
  readonly languages: readonly ProjectLanguageViewModel[]
}

export interface ProjectRepoViewModel {
  readonly id: string
  readonly name: string
  readonly htmlUrl: string
  readonly language: string | null
  readonly starsLabel: string | null
  readonly description: string
  readonly descriptionClassName: string | undefined
  readonly updatedLabel: string
}

export interface ProjectOwnerViewModel {
  readonly id: string
  readonly label: string
  readonly meter: string
  readonly repos: readonly ProjectRepoViewModel[]
}

export interface ProjectOwnersViewProps {
  readonly owners: readonly ProjectOwnerViewModel[]
}

export interface ProjectsDataViewModel {
  readonly stats: readonly ProjectStatViewModel[]
  readonly contributionMeter: string | null
  readonly contributionGraph: ContributionGraphViewProps | null
  readonly commits: ProjectCommitArchiveViewModel | null
  readonly activity: ProjectActivityViewModel
  readonly languagesMeter: string
  readonly languages: readonly ProjectLanguageViewModel[]
  readonly owners: readonly ProjectOwnerViewModel[]
}

export interface ProjectsViewProps {
  readonly isLoading: boolean
  readonly isError: boolean
  readonly degradedMessage: string | null
  readonly data: ProjectsDataViewModel | null
}

export const activityLabel = (kind: string, count: number): string => {
  const normalized = kind.replaceAll('_', ' ')
  const forms = ACTIVITY_INFLECTIONS[kind] ?? [normalized, `${normalized}s`]
  return forms[count === 1 ? 0 : 1]
}

const relativeAgeAt = (now: number, iso: string): string => {
  const days = Math.floor((now - Date.parse(iso)) / DAY_MS)
  const ranges: ReadonlyArray<readonly [number, (value: number) => string]> = [
    [1, () => 'today'],
    [2, () => 'yesterday'],
    [31, (value) => `${value} days ago`],
    [366, (value) => `${Math.floor(value / 30)} months ago`],
  ]
  const range = ranges.find(([limit]) => days < limit)
  return range ? range[1](days) : `${Math.floor(days / 365)} years ago`
}

const selectCommitKind = ({ type, scope }: GithubCommit): string =>
  [type ?? 'change', scope].filter(Boolean).join(':')

const selectRepoAt = (now: number, repo: GithubRepo): ProjectRepoViewModel => ({
  id: repo.id,
  name: repo.name,
  htmlUrl: repo.htmlUrl,
  language: repo.language,
  starsLabel: repo.stars > 0 ? `★ ${repo.stars}` : null,
  description: repo.description ?? 'No description yet.',
  descriptionClassName: repo.description ? undefined : 'readout-label',
  updatedLabel: `Updated ${relativeAgeAt(now, repo.pushedAt)}`,
})

const selectDegradedMessage = (data: GithubSummary | undefined): string | null => {
  const degradedResources = data?.availability
    ? Object.entries(data.availability.resources)
        .filter(([, resource]) =>
          ['partial', 'stale', 'unavailable'].includes(resource.state)
        )
        .map(([name]) => name)
    : []

  return degradedResources.length > 0
    ? `Live data is partially degraded (${degradedResources.join(', ')}). Available records remain visible while the archive retries.`
    : null
}

export const selectProjectsViewModelAt =
  (now: number) =>
  (
    summary: GithubSummary | undefined,
    visualization: ThemeVisualization
  ): ProjectsViewProps => {
    const languageTotal =
      summary?.languages.reduce((total, language) => total + language.count, 0) ?? 0
    const commits = summary?.commits?.commits.length
      ? {
          meter: `${summary.commits.total.toLocaleString()} indexed`,
          commits: summary.commits.commits.slice(0, 8).map((commit) => ({
            id: `${commit.repo}-${commit.sha}`,
            sha: commit.sha,
            repo: commit.repo,
            url: commit.url,
            age: relativeAgeAt(now, commit.at),
            subject: commit.subject,
            kind: selectCommitKind(commit),
          })),
        }
      : null

    return {
      isLoading: false,
      isError: false,
      degradedMessage: selectDegradedMessage(summary),
      data: summary
        ? {
            stats: [
              { id: 'repos', value: String(summary.repos.length), label: 'repos shown' },
              {
                id: 'languages',
                value: String(summary.languages.length),
                label: 'languages',
              },
              {
                id: 'events',
                value: String(summary.activity.total),
                label: 'recent events',
              },
              {
                id: 'followers',
                value: String(summary.profile.followers),
                label: 'followers',
              },
            ],
            contributionMeter: summary.contributions
              ? `${summary.contributions.total.toLocaleString()} / yr`
              : null,
            contributionGraph: summary.contributions
              ? selectContributionGraphViewModel(summary.contributions, visualization)
              : null,
            commits,
            activity: {
              meter: `${summary.activity.total} events`,
              kinds: summary.activity.byKind.map(({ kind, count }) => ({
                id: kind,
                label: activityLabel(kind, count),
                count: String(count),
              })),
              repos: summary.activity.byRepo.map(({ repo, count }) => ({
                id: repo,
                label: repo,
                href: `https://github.com/${repo}`,
                detail: `${count} events`,
              })),
              summary: summary.activity.since
                ? `${summary.activity.total} public events since ${relativeAgeAt(now, summary.activity.since)}`
                : null,
            },
            languagesMeter: `${summary.languages.length} in use`,
            languages: summary.languages.map(({ language, count }) => ({
              id: language,
              language,
              detail: `${count} · ${Math.round((count / languageTotal) * 100)}%`,
            })),
            owners: summary.owners.map((owner) => ({
              id: owner.owner,
              label: owner.owner,
              meter: `${owner.count} repos`,
              repos: summary.repos
                .filter((repo) => repo.owner === owner.owner)
                .map((repo) => selectRepoAt(now, repo)),
            })),
          }
        : null,
    }
  }
