import {
  _,
  fromNullable,
  match,
  multiMatch,
  orElse,
} from 'functional-programming-composition'
import type { MissionsPresentation } from '../../../../../components/registry/missions/operations/operationsTypes'
import type { GithubSummary } from '../../../../../components/substrate/kernel/api/apiTypes'
import type { ThemeVisualization } from '../../../../../../styles/themes/themeTypes'

export interface MissionsSourceInput {
  readonly summary: GithubSummary | undefined
  readonly visualization: ThemeVisualization
  readonly retainedTransportFailure: boolean
}

const degradedResourcesOf = (source: MissionsSourceInput): readonly string[] =>
  Object.entries(source.summary?.availability?.resources ?? {})
    .filter(([, resource]) =>
      ['partial', 'stale', 'unavailable'].includes(resource.state)
    )
    .map(([name]) => name)

const isStale = (source: MissionsSourceInput): boolean =>
  Boolean(source.summary) &&
  (source.retainedTransportFailure ||
    Boolean(source.summary?.stale) ||
    source.summary?.availability?.state === 'stale')

export const selectMissionDegradedMessage =
  (presentation: MissionsPresentation | undefined) =>
  (source: MissionsSourceInput): string | null =>
    match(
      fromNullable(presentation),
      (copy) => {
        const degradedResources = degradedResourcesOf(source)
        return orElse(
          multiMatch<MissionsSourceInput, string | null>(source, [
            [isStale, () => `${copy.staleLabel} ${copy.staleDetail}`],
            [
              () => degradedResources.length > 0,
              () =>
                `${copy.partialLabel} (${degradedResources.join(', ')}). ${copy.partialDetail}`,
            ],
            [_, () => null],
          ]),
          null
        )
      },
      () => null
    )
