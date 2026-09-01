import type { MissionsPresentation } from '../../../../../components/registry/missions/operations/operationsTypes'
import type {
  GithubCommit,
  GithubRepo,
} from '../../../../../components/substrate/kernel/api/apiTypes'

const DAY_MS = 86_400_000

type MissionCopy = MissionsPresentation['copy']

export const selectActivityLabel =
  (copy: MissionCopy) =>
  (kind: string, count: number): string => {
    const normalized = kind.replaceAll('_', ' ')
    const forms = copy.activityKinds[kind]

    return forms
      ? forms[count === 1 ? 'singular' : 'plural']
      : `${normalized}${count === 1 ? '' : 's'}`
  }

export const selectRelativeAgeAt =
  (now: number) =>
  (copy: MissionCopy) =>
  (iso: string): string => {
    const days = Math.floor((now - Date.parse(iso)) / DAY_MS)
    const ranges: ReadonlyArray<readonly [number, (value: number) => string]> = [
      [1, () => copy.today],
      [2, () => copy.yesterday],
      [31, (value) => `${value} ${copy.daysAgoUnit}`],
      [366, (value) => `${Math.floor(value / 30)} ${copy.monthsAgoUnit}`],
    ]
    const range = ranges.find(([limit]) => days < limit)

    return range ? range[1](days) : `${Math.floor(days / 365)} ${copy.yearsAgoUnit}`
  }

export const selectCommitKind =
  (copy: MissionCopy) =>
  ({ type, scope }: GithubCommit): string =>
    [type ?? copy.changeKind, scope].filter(Boolean).join(':')

export const selectRepositoryAt =
  (now: number) => (copy: MissionCopy) => (repo: GithubRepo) => ({
    id: repo.id,
    name: repo.name,
    htmlUrl: repo.htmlUrl,
    language: repo.language,
    starsLabel: repo.stars > 0 ? `${copy.starPrefix} ${repo.stars}` : null,
    description: repo.description,
    updatedLabel: `${copy.updatedPrefix} ${selectRelativeAgeAt(now)(copy)(repo.pushedAt)}`,
  })
