export interface LoggedAction {
  readonly id: number
  readonly type: string
  readonly at: number
}

export interface DiagnosticsState {
  readonly entries: readonly LoggedAction[]
  readonly sequence: number
}

export interface ObservedAction {
  readonly type: string
  readonly at: number
}
