import type { Contributions } from '../../../../../components/platform/foundation/api/apiTypes'
import type { ThemeVisualization } from '../../../../../../styles/themes/themeTypes'

const CELL = 11
const GAP = 2
const STEP = CELL + GAP
const ROWS = 7
const LABEL_GUTTER = 26
const MONTH_BAR = 14
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export interface ContributionTickViewModel {
  readonly id: string
  readonly label: string
  readonly x: number
  readonly y: number
  readonly fill: string
}

export interface ContributionCellViewModel {
  readonly id: string
  readonly testId: string
  readonly x: number
  readonly y: number
  readonly size: number
  readonly fill: string
}

export interface ContributionLegendViewModel {
  readonly id: string
  readonly color: string
  readonly size: number
  readonly accessibilityLabel: string
}

export interface ContributionGraphViewProps {
  readonly headline: string
  readonly accessibilityLabel: string
  readonly width: number
  readonly height: number
  readonly monthTicks: readonly ContributionTickViewModel[]
  readonly weekdayTicks: readonly ContributionTickViewModel[]
  readonly cells: readonly ContributionCellViewModel[]
  readonly legend: readonly ContributionLegendViewModel[]
}

const MONTH_OFFSETS = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4] as const

const dayOfWeek = (iso: string): number => {
  const [calendarYear, month, day] = iso.split('-').map(Number)
  const year = month < 3 ? calendarYear - 1 : calendarYear
  return (
    (year +
      Math.floor(year / 4) -
      Math.floor(year / 100) +
      Math.floor(year / 400) +
      MONTH_OFFSETS[month - 1] +
      day) %
    ROWS
  )
}

const monthOf = (iso: string): (typeof MONTHS)[number] =>
  MONTHS[Number(iso.slice(5, 7)) - 1]

export const selectContributionGraphViewModel = (
  contributions: Contributions,
  visualization: ThemeVisualization
): ContributionGraphViewProps => {
  const firstDate = contributions.days[0]?.date
  const offset = firstDate ? dayOfWeek(firstDate) : 0
  const positioned = contributions.days.map((day, index) => {
    const slot = index + offset
    return { day, column: Math.floor(slot / ROWS), row: slot % ROWS }
  })
  const columns = Math.max(...positioned.map(({ column }) => column), 0) + 1
  const rawMonthTicks = positioned.reduce<Array<{ label: string; column: number }>>(
    (ticks, { day, column }) => {
      const label = monthOf(day.date)
      const last = ticks[ticks.length - 1]
      return last?.label === label ? ticks : [...ticks, { label, column }]
    },
    []
  )
  const headline = `${contributions.total.toLocaleString()} contributions in the last year`

  return {
    headline,
    accessibilityLabel: `Contribution calendar: ${headline}`,
    width: LABEL_GUTTER + columns * STEP,
    height: MONTH_BAR + ROWS * STEP,
    monthTicks: rawMonthTicks.map(({ label, column }) => ({
      id: `m-${label}-${column}`,
      label,
      x: LABEL_GUTTER + column * STEP,
      y: MONTH_BAR - 4,
      fill: visualization.axisInk,
    })),
    weekdayTicks: [
      { id: 'monday', label: 'Mon', x: 0, y: MONTH_BAR + STEP + CELL - 1 },
      { id: 'wednesday', label: 'Wed', x: 0, y: MONTH_BAR + 3 * STEP + CELL - 1 },
      { id: 'friday', label: 'Fri', x: 0, y: MONTH_BAR + 5 * STEP + CELL - 1 },
    ].map((tick) => ({ ...tick, fill: visualization.axisInk })),
    cells: positioned.map(({ day, column, row }) => ({
      id: day.date,
      testId: `contribution-cell-${day.date}`,
      x: LABEL_GUTTER + column * STEP,
      y: MONTH_BAR + row * STEP,
      size: CELL,
      fill: visualization.contributionRamp[Math.min(day.level, 4)],
    })),
    legend: visualization.contributionRamp.map((color, level) => ({
      id: `${level}-${color}`,
      color,
      size: CELL,
      accessibilityLabel: `Level ${level}`,
    })),
  }
}
