export interface HomePresenceViewModel {
  readonly id: string
  readonly url: string
  readonly label: string
}

export interface HomeViewProps {
  readonly presences: readonly HomePresenceViewModel[]
}

const WEB_PRESENCES = [
  'https://seandinwiddie.com',
  'https://sdin.dev',
  'https://seandinwiddie.github.io',
] as const

export const selectHomeViewModel = (): HomeViewProps => ({
  presences: WEB_PRESENCES.map((url) => ({
    id: url,
    url,
    label: url.replace(/^https:\/\//, ''),
  })),
})
