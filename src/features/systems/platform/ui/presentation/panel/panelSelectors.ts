import type { ReactNode } from 'react'

export type PanelViewProps = {
  readonly label: string
  readonly meter?: string | number
  readonly children: ReactNode
}
