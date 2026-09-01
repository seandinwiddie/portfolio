import type {
  ApiDataSource,
  ApiStatus,
  GithubSummary,
} from '../../../substrate/kernel/api/apiTypes'
import type { RuntimeTelemetryPresentation } from '../../../substrate/kernel/api/presentation/presentationTypes'

export interface TelemetrySelectorInput {
  readonly brandName: string
  readonly source: ApiDataSource
  readonly themeStatus: string
  readonly themeLabel: string
  readonly themeSource: string | null
  readonly themes: readonly string[]
  readonly actions: readonly Readonly<{ type: string }>[]
  readonly api: Readonly<{
    data: ApiStatus | undefined
    isError: boolean
    startedTimeStamp: number | undefined
    fulfilledTimeStamp: number | undefined
  }>
  readonly github: Readonly<{
    data: GithubSummary | undefined
    isFetching: boolean
    isError: boolean
  }>
  readonly reducedMotion: boolean
  readonly viewport: Readonly<{ width: number; height: number }>
  readonly presentation: RuntimeTelemetryPresentation
}
