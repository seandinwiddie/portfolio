import {
  _,
  fromNullable,
  match,
  multiMatch,
  orElse,
} from 'functional-programming-composition'
import type { GithubSummary } from '../../../../../components/platform/foundation/api/apiTypes'

export type ArchiveFeedState = 'IDLE' | 'SYNC' | 'LIVE' | 'OFFLINE'

export type ArchiveCommandContext = {
  readonly data?: GithubSummary
  readonly feedState: ArchiveFeedState
  readonly themes: readonly string[]
}

export type ArchiveEffect =
  | { readonly type: 'none' }
  | { readonly type: 'cycle-theme' }
  | { readonly type: 'select-theme'; readonly mode: string }

export type ArchiveCommandResult = {
  readonly lines: readonly string[]
  readonly effect: ArchiveEffect
}

type ArchiveCommandRequest = {
  readonly argument: string
  readonly context: ArchiveCommandContext
}

type ParsedArchiveCommand = ArchiveCommandRequest & {
  readonly raw: string
  readonly verb: string
}

type DataProjection = {
  readonly data: GithubSummary
  readonly argument: string
}

type Command = (request: ArchiveCommandRequest) => ArchiveCommandResult

const NO_EFFECT: ArchiveEffect = { type: 'none' }
const NO_DATA = ['no telemetry yet — the feed is still syncing.']
const NO_COMMITS = ['no commit archive is available.']

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
    (data) => resultOf(project({ data, argument: request.argument })),
    () => resultOf(NO_DATA)
  )

const help: Command = () =>
  resultOf([
    'available commands',
    '  help       list commands',
    '  whoami     unit record',
    '  repos      most recently touched repositories',
    '  langs      language distribution',
    '  activity   recent public activity by repository',
    '  commits    recent commit archive',
    '  status     archive feed status',
    '  theme      set or cycle the theme',
    '',
    'Escape closes Archive Control. Backtick (`) or Cmd/Ctrl+K toggles it outside fields.',
  ])

const whoami: Command = (request) =>
  withData(request, ({ data }) => [
    `designation  ${data.profile.name ?? data.profile.login}`,
    `origin       ${data.profile.location ?? 'undisclosed'}`,
    `incept       ${data.since?.slice(0, 10) ?? 'unknown'}`,
    `units        ${data.repos.length} repositories`,
    `output       ${data.contributions?.total.toLocaleString() ?? '—'} contributions / cycle`,
  ])

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
        () => [`no repositories for "${projection.argument.trim()}"`],
      ],
      [
        _,
        (items) =>
          items
            .slice(0, 12)
            .map((repo) => `${repo.fullName.padEnd(38)} ${repo.language ?? '—'}`),
      ],
    ]),
    NO_DATA
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

const commitLines = ({ data }: DataProjection): readonly string[] => {
  const commits = data.commits?.commits ?? []
  return orElse(
    multiMatch(commits, [
      [(items) => items.length === 0, () => NO_COMMITS],
      [
        _,
        (items) =>
          items
            .slice(0, 12)
            .map((commit) => `${commit.sha} ${commit.repo.padEnd(30)} ${commit.subject}`),
      ],
    ]),
    NO_COMMITS
  )
}

const commits: Command = (request) => withData(request, commitLines)

const status: Command = ({ context }) =>
  resultOf([
    `feed          ${context.feedState}`,
    `repositories  ${context.data?.repos.length ?? '—'}`,
    `commits       ${context.data?.commits?.total.toLocaleString() ?? '—'}`,
  ])

const theme: Command = ({ argument, context }) => {
  const name = argument.trim().toLowerCase()
  return orElse(
    multiMatch(name, [
      [
        (candidate) => candidate.length === 0,
        () => resultOf(['cycled.'], { type: 'cycle-theme' }),
      ],
      [
        (candidate) => context.themes.includes(candidate),
        (candidate) =>
          resultOf([`theme set to ${candidate}.`], {
            type: 'select-theme',
            mode: candidate,
          }),
      ],
      [
        _,
        (candidate) =>
          resultOf([
            `unknown theme "${candidate}". available: ${context.themes.join(', ')}`,
          ]),
      ],
    ]),
    resultOf(['theme command unavailable.'])
  )
}

const COMMANDS: Readonly<Record<string, Command>> = {
  help,
  whoami,
  repos,
  langs,
  activity,
  commits,
  status,
  theme,
}

const parseCommand = (raw: string): ParsedArchiveCommand => {
  const [verb = '', ...argument] = raw.trim().split(/\s+/u)
  return {
    raw: raw.trim(),
    verb: verb.toLowerCase(),
    argument: argument.join(' '),
    context: { feedState: 'IDLE', themes: [] },
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
    () => resultOf([`unknown command "${parsed.verb}". type \`help\`.`])
  )
}
