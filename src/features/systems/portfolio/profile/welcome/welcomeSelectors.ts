import type { GithubSummary } from '../../../../components/platform/foundation/api/apiTypes'

const GLYPHS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const
const WEEK = 7
const YEAR_MS = 31_557_600_000
const SITE_URL = 'https://portfolio.sdin.dev'

export type WelcomeHref = '/projects' | '/about' | '/status'

export interface WelcomeCtaViewModel {
  readonly href: WelcomeHref
  readonly label: string
}

export interface SignalTraceViewProps {
  readonly visible: boolean
  readonly trace: string
  readonly accessibilityLabel: string
}

export interface UnitPlateRowViewModel {
  readonly id: string
  readonly label: string
  readonly value: string
}

export interface UnitPlateViewProps {
  readonly visible: boolean
  readonly rows: readonly UnitPlateRowViewModel[]
}

export interface InstallQrViewProps {
  readonly visible: boolean
  readonly target: string
  readonly linkLabel: string
  readonly title: string
  readonly description: string
}

export interface WelcomeViewProps {
  readonly ctas: readonly WelcomeCtaViewModel[]
  readonly signalTrace: SignalTraceViewProps
  readonly unitPlate: UnitPlateViewProps
  readonly installQr: InstallQrViewProps
  readonly onNavigate: (href: WelcomeHref) => void
}

const CTAS: readonly WelcomeCtaViewModel[] = [
  { href: '/projects', label: 'Live Projects' },
  { href: '/about', label: 'Explore Portfolio' },
  { href: '/status', label: 'View Status' },
]

const traceOf = (summary: GithubSummary | undefined): SignalTraceViewProps => {
  const contributions = summary?.contributions
  const weeks =
    Array.from(contributions?.days.entries() ?? []).reduce<number[]>(
      (totals, [index, day]) => {
        const bucket = Math.floor(index / WEEK)
        const next = [...totals]
        next[bucket] = (next[bucket] ?? 0) + day.count
        return next
      },
      []
    ) ?? []
  const peak = Math.max(...weeks, 1)
  const trace = weeks
    .map((total) => {
      const level =
        total === 0 ? 0 : Math.max(1, Math.ceil((total / peak) * (GLYPHS.length - 1)))
      return GLYPHS[level]
    })
    .join('')

  return {
    visible: weeks.length > 0,
    trace,
    accessibilityLabel: `Signal trace of ${contributions?.total ?? 0} contributions over the last year`,
  }
}

const rowsAt = (
  now: number,
  summary: GithubSummary | undefined
): readonly UnitPlateRowViewModel[] => {
  const years = summary?.since
    ? Math.floor((now - Date.parse(summary.since)) / YEAR_MS)
    : null

  return summary
    ? [
        {
          id: 'designation',
          label: 'designation',
          value: (summary.profile.name ?? summary.profile.login).toUpperCase(),
        },
        { id: 'class', label: 'class', value: 'AI SYSTEMS ARCHITECT' },
        ...(summary.since && years !== null
          ? [
              {
                id: 'incept',
                label: 'incept',
                value: `${summary.since.slice(0, 10)} · ${years} YR RECORD`,
              },
            ]
          : []),
        {
          id: 'origin',
          label: 'origin',
          value: (summary.profile.location ?? 'UNDISCLOSED').toUpperCase(),
        },
        {
          id: 'operators',
          label: 'operators',
          value: summary.owners
            .map(({ owner }) => owner)
            .join(' · ')
            .toUpperCase(),
        },
        {
          id: 'primary-systems',
          label: 'primary systems',
          value: summary.languages
            .slice(0, 3)
            .map(({ language }) => language)
            .join(' · ')
            .toUpperCase(),
        },
      ]
    : []
}

export const selectInstallQrViewModel = (
  nativeUrl: string | undefined,
  visible: boolean
): InstallQrViewProps => {
  const target = nativeUrl ?? SITE_URL
  const isNative = Boolean(nativeUrl)

  return {
    visible,
    target,
    linkLabel: target.replace(/^https:\/\//, ''),
    title: isNative ? 'Also a native app' : 'Open this on your phone',
    description: isNative
      ? 'One Expo codebase — this same page ships to iOS and Android. Scan to install it.'
      : 'Scan to open the live site on another device. This Expo project also targets iOS and Android; no public native install is linked here.',
  }
}

export const selectWelcomeViewModelAt =
  (now: number) =>
  (
    summary: GithubSummary | undefined
  ): Omit<WelcomeViewProps, 'installQr' | 'onNavigate'> => ({
    ctas: CTAS,
    signalTrace: traceOf(summary),
    unitPlate: { visible: Boolean(summary), rows: rowsAt(now, summary) },
  })
