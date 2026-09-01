export interface MissionsPresentation {
  readonly eyebrow: string
  readonly headline: string
  readonly statement: string
  readonly loadingLabel: string
  readonly errorLabel: string
  readonly partialLabel: string
  readonly partialDetail: string
  readonly staleLabel: string
  readonly staleDetail: string
  readonly panels: Readonly<{
    contributions: string
    recorder: string
    activity: string
    languages: string
  }>
  readonly metrics: Readonly<{
    repositories: string
    languages: string
    events: string
    followers: string
  }>
  readonly copy: Readonly<{
    activityKinds: Readonly<
      Record<string, Readonly<{ singular: string; plural: string }>>
    >
    today: string
    yesterday: string
    daysAgoUnit: string
    monthsAgoUnit: string
    yearsAgoUnit: string
    changeKind: string
    updatedPrefix: string
    indexedUnit: string
    annualUnit: string
    eventsUnit: string
    publicEventsPrefix: string
    inUseUnit: string
    repositoriesUnit: string
    starPrefix: string
  }>
}
