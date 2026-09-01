import type {
  GithubSummary,
  StationRoute,
  IngressInstallation,
  IngressPresentation,
} from '../../../../components/substrate/kernel/api/apiTypes'
import type { RuntimeDossierPresentation } from '../../../../components/substrate/kernel/api/presentation/presentationTypes'
import type { ApiDocumentStatusViewModel } from '../../../substrate/kernel/api/apiSelectors'

const GLYPHS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const
const WEEK = 7
const YEAR_MS = 31_557_600_000
export interface SignalTraceViewProps {
  readonly visible: boolean
  readonly trace: string
  readonly accessibilityLabel: string
  readonly label: string
}

export interface UnitPlateRowViewModel {
  readonly id: string
  readonly label: string
  readonly value: string
}

export interface UnitPlateViewProps {
  readonly visible: boolean
  readonly rows: readonly UnitPlateRowViewModel[]
  readonly heading: string
  readonly status: string
}

export interface InstallQrViewProps {
  readonly visible: boolean
  readonly target: string
  readonly linkLabel: string
  readonly title: string
  readonly description: string
}

export interface IngressCtaViewModel {
  readonly href: StationRoute
  readonly label: string
}

export interface IngressViewProps {
  readonly dataStatus: ApiDocumentStatusViewModel
  readonly available: boolean
  readonly eyebrow: string
  readonly identityLabel: string
  readonly name: string
  readonly statement: string
  readonly accessLabel: string
  readonly accessCountLabel: string
  readonly ctas: readonly IngressCtaViewModel[]
  readonly signalTrace: SignalTraceViewProps
  readonly unitPlate: UnitPlateViewProps
  readonly installQr: InstallQrViewProps
}

const traceOf = (
  summary: GithubSummary | undefined,
  presentation: RuntimeDossierPresentation | undefined
): SignalTraceViewProps => {
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
    accessibilityLabel:
      `${presentation?.unitPlate.traceAccessibilityPrefix ?? ''} ${contributions?.total ?? 0}`.trim(),
    label: presentation?.unitPlate.traceLabel ?? '',
  }
}

const rowsAt =
  (now: number, unitClass: string) =>
  (presentation: RuntimeDossierPresentation | undefined) =>
  (summary: GithubSummary | undefined): readonly UnitPlateRowViewModel[] => {
    const years = summary?.since
      ? Math.floor((now - Date.parse(summary.since)) / YEAR_MS)
      : null

    return summary
      ? [
          {
            id: 'designation',
            label: presentation?.unitPlate.rows.designation ?? '',
            value: (summary.profile.name ?? summary.profile.login).toUpperCase(),
          },
          {
            id: 'class',
            label: presentation?.unitPlate.rows.class ?? '',
            value: unitClass,
          },
          ...(summary.since && years !== null
            ? [
                {
                  id: 'incept',
                  label: presentation?.unitPlate.rows.incept ?? '',
                  value:
                    `${summary.since.slice(0, 10)} · ${years} ${presentation?.unitPlate.recordSuffix ?? ''}`.trim(),
                },
              ]
            : []),
          {
            id: 'origin',
            label: presentation?.unitPlate.rows.origin ?? '',
            value: (
              summary.profile.location ??
              presentation?.unitPlate.undisclosed ??
              ''
            ).toUpperCase(),
          },
          {
            id: 'operators',
            label: presentation?.unitPlate.rows.operators ?? '',
            value: summary.owners
              .map(({ owner }) => owner)
              .join(' · ')
              .toUpperCase(),
          },
          {
            id: 'primary-systems',
            label: presentation?.unitPlate.rows.primarySystems ?? '',
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
  installation: IngressInstallation | undefined,
  visible: boolean
): InstallQrViewProps => {
  const target = installation?.nativeUrl ?? installation?.webUrl ?? ''
  const isNative = Boolean(installation?.nativeUrl)

  return {
    visible: visible && Boolean(target),
    target,
    linkLabel: target.replace(/^https:\/\//, ''),
    title: isNative ? (installation?.nativeTitle ?? '') : (installation?.webTitle ?? ''),
    description: isNative
      ? (installation?.nativeDescription ?? '')
      : (installation?.webDescription ?? ''),
  }
}

export const selectIngressViewModelAt =
  (now: number) =>
  (
    presentation: IngressPresentation | undefined,
    runtimePresentation: RuntimeDossierPresentation | undefined
  ) =>
  (
    summary: GithubSummary | undefined
  ): Omit<IngressViewProps, 'dataStatus' | 'installQr'> => ({
    available: Boolean(presentation),
    eyebrow: presentation?.eyebrow ?? '',
    identityLabel: presentation?.identityLabel ?? '',
    name: presentation?.name ?? '',
    statement: presentation?.statement ?? '',
    accessLabel: presentation?.accessLabel ?? '',
    accessCountLabel: presentation?.accessCountLabel ?? '',
    ctas: presentation?.ctas.map(({ href, label }) => ({ href, label })) ?? [],
    signalTrace: traceOf(summary, runtimePresentation),
    unitPlate: {
      visible: Boolean(summary),
      rows: rowsAt(now, presentation?.unitClass ?? '')(runtimePresentation)(summary),
      heading: runtimePresentation?.unitPlate.heading ?? '',
      status: runtimePresentation?.unitPlate.status ?? '',
    },
  })
