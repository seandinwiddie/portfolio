import {
  _,
  fromNullable,
  match,
  multiMatch,
  orElse,
} from 'functional-programming-composition'
import type { GithubSummary } from '../../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeArchivePresentation } from '../../../../../components/substrate/kernel/api/presentation/presentationTypes'

export type ArchiveFeedState = string

export type ArchiveCommandContext = {
  readonly data?: GithubSummary
  readonly feedState: ArchiveFeedState
  readonly themes: readonly string[]
  readonly copy: RuntimeArchivePresentation['commands']
}

export type ArchiveEffect =
  | { readonly type: 'none' }
  | { readonly type: 'cycle-theme' }
  | { readonly type: 'select-theme'; readonly mode: string }
  | { readonly type: 'navigate'; readonly href: ArchiveRoute }

export type ArchiveRoute = '/' | '/nexus' | '/dossier' | '/missions' | '/telemetry'

export type ArchiveCommandResult = {
  readonly lines: readonly string[]
  readonly effect: ArchiveEffect
}

export const MAX_ARCHIVE_COMMAND_LENGTH = 256

type ArchiveCommandRequest = {
  readonly argument: string
  readonly context: ArchiveCommandContext
}

type ParsedArchiveCommand = {
  readonly raw: string
  readonly verb: string
  readonly argument: string
}

type DataProjection = {
  readonly data: GithubSummary
  readonly argument: string
  readonly copy: RuntimeArchivePresentation['commands']
}

type Command = (request: ArchiveCommandRequest) => ArchiveCommandResult

const NO_EFFECT: ArchiveEffect = { type: 'none' }

const resultOf = (
  lines: readonly string[],
  effect: ArchiveEffect = NO_EFFECT
): ArchiveCommandResult => ({ lines, effect })

const withData = (
  request: ArchiveCommandRequest,
  project: (projection: DataProjection) => readonly string[]
): ArchiveCommandResult =>
  match(
    fromNullable(request.context.data),
    (data) =>
      resultOf(project({ data, argument: request.argument, copy: request.context.copy })),
    () => resultOf([request.context.copy.noData])
  )

const fieldLine = (label: string, value: string): string => `${label.padEnd(13)}${value}`

const help: Command = ({ context }) => resultOf(context.copy.help)

const whoami: Command = (request) =>
  withData(request, ({ data }) => {
    const { copy } = request.context
    return [
      fieldLine(copy.labels.designation ?? '', data.profile.name ?? data.profile.login),
      fieldLine(copy.labels.origin ?? '', data.profile.location ?? copy.undisclosed),
      fieldLine(copy.labels.incept ?? '', data.since?.slice(0, 10) ?? copy.unknown),
      fieldLine(copy.labels.units ?? '', `${data.repos.length} ${copy.repositoryUnit}`),
      fieldLine(
        copy.labels.output ?? '',
        `${data.contributions?.total.toLocaleString() ?? '—'} ${copy.contributionUnit}`
      ),
    ]
  })

const nonEmpty = (value: string): string | null =>
  value.trim().length > 0 ? value.trim().toLowerCase() : null

const reposFor = ({ data, argument }: DataProjection) =>
  match(
    fromNullable(nonEmpty(argument)),
    (owner) => data.repos.filter((repo) => repo.owner.toLowerCase() === owner),
    () => data.repos
  )

const repoLines = (projection: DataProjection): readonly string[] => {
  const repositories = reposFor(projection)
  return orElse(
    multiMatch(repositories, [
      [
        (items) => items.length === 0,
        () => [
          `${projection.copy.noRepositoriesPrefix}${projection.argument.trim()}${projection.copy.noRepositoriesSuffix}`,
        ],
      ],
      [
        _,
        (items) =>
          items
            .slice(0, 12)
            .map((repo) => `${repo.fullName.padEnd(38)} ${repo.language ?? '—'}`),
      ],
    ]),
    [projection.copy.noData]
  )
}

const repos: Command = (request) => withData(request, repoLines)

const langs: Command = (request) =>
  withData(request, ({ data }) =>
    data.languages.map(
      (language) =>
        `${language.language.padEnd(14)} ${'█'.repeat(language.count)} ${language.count}`
    )
  )

const activity: Command = (request) =>
  withData(request, ({ data }) =>
    data.activity.byRepo.map(
      (activityEntry) => `${activityEntry.repo.padEnd(38)} ${activityEntry.count}`
    )
  )

const commitLines = ({ data, copy }: DataProjection): readonly string[] => {
  const commits = data.commits?.commits ?? []
  return orElse(
    multiMatch(commits, [
      [(items) => items.length === 0, () => [copy.noCommits]],
      [
        _,
        (items) =>
          items
            .slice(0, 12)
            .map((commit) => `${commit.sha} ${commit.repo.padEnd(30)} ${commit.subject}`),
      ],
    ]),
    [copy.noCommits]
  )
}

const commits: Command = (request) => withData(request, commitLines)

const telemetry: Command = ({ context }) =>
  resultOf([
    fieldLine(context.copy.labels.feed ?? '', context.feedState),
    fieldLine(
      context.copy.labels.repositories ?? '',
      String(context.data?.repos.length ?? '—')
    ),
    fieldLine(
      context.copy.labels.commits ?? '',
      String(context.data?.commits?.total.toLocaleString() ?? '—')
    ),
  ])

const theme: Command = ({ argument, context }) => {
  const name = argument.trim().toLowerCase()
  return orElse(
    multiMatch(name, [
      [
        (candidate) => candidate.length === 0,
        () => resultOf([context.copy.themeCycled], { type: 'cycle-theme' }),
      ],
      [
        (candidate) => context.themes.includes(candidate),
        (candidate) =>
          resultOf(
            [`${context.copy.themeSetPrefix}${candidate}${context.copy.themeSetSuffix}`],
            {
              type: 'select-theme',
              mode: candidate,
            }
          ),
      ],
      [
        _,
        (candidate) =>
          resultOf([
            `${context.copy.unknownThemePrefix}${candidate}${context.copy.unknownThemeMiddle}${context.themes.join(', ')}`,
          ]),
      ],
    ]),
    resultOf([context.copy.commandUnavailable])
  )
}

const ROUTE_BY_NAME: Readonly<Record<string, ArchiveRoute>> = {
  ingress: '/',
  nexus: '/nexus',
  dossier: '/dossier',
  missions: '/missions',
  telemetry: '/telemetry',
}

const go: Command = ({ argument, context }) => {
  const name = argument.trim().toLowerCase()
  return match(
    fromNullable(ROUTE_BY_NAME[name]),
    (href) =>
      resultOf([`${context.copy.openingPrefix}${name}${context.copy.openingSuffix}`], {
        type: 'navigate',
        href,
      }),
    () => resultOf([context.copy.navigationUsage])
  )
}

const COMMANDS: Readonly<Record<string, Command>> = {
  help,
  whoami,
  repos,
  langs,
  activity,
  commits,
  telemetry,
  theme,
  go,
}

export const normalizeArchiveCommand = (raw: string): string =>
  raw.slice(0, MAX_ARCHIVE_COMMAND_LENGTH).trim()

const parseCommand = (raw: string): ParsedArchiveCommand => {
  const bounded = normalizeArchiveCommand(raw)
  const [verb = '', ...argument] = bounded.split(/\s+/u)
  return {
    raw: bounded,
    verb: verb.toLowerCase(),
    argument: argument.join(' '),
  }
}

export const executeArchiveCommand = (
  raw: string,
  context: ArchiveCommandContext
): ArchiveCommandResult => {
  const parsed = parseCommand(raw)
  return match(
    fromNullable(COMMANDS[parsed.verb]),
    (command) => command({ argument: parsed.argument, context }),
    () =>
      resultOf([
        `${context.copy.unknownCommandPrefix}${parsed.verb}${context.copy.unknownCommandSuffix}`,
      ])
  )
}
