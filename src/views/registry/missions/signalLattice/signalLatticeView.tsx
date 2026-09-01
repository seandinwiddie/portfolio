import type React from 'react'
import Svg, { Rect, Text as SvgText } from 'react-native-svg'
import { ScrollView, Text, XStack, YStack } from 'tamagui'
import type {
  ContributionCellViewModel,
  SignalLatticeViewProps,
  ContributionLegendViewModel,
  ContributionTickViewModel,
} from '../../../../features/systems/registry/missions/operations/signalLattice/signalLatticeSelectors'

const MonthTick: React.FC<ContributionTickViewModel> = ({ label, x, y, fill }) => (
  <SvgText x={x} y={y} fontSize={9} fill={fill}>
    {label}
  </SvgText>
)

const renderMonthTicks = (ticks: readonly ContributionTickViewModel[]): React.ReactNode =>
  ticks.map((tick) => <MonthTick key={tick.id} {...tick} />)

const ContributionCell: React.FC<ContributionCellViewModel> = ({
  testId,
  x,
  y,
  size,
  fill,
}) => <Rect testID={testId} x={x} y={y} width={size} height={size} rx={2} fill={fill} />

const renderCells = (cells: readonly ContributionCellViewModel[]): React.ReactNode =>
  cells.map((cell) => <ContributionCell key={cell.id} {...cell} />)

const LegendCell: React.FC<ContributionLegendViewModel> = ({
  color,
  size,
  accessibilityLabel,
}) => (
  <YStack
    width={size}
    height={size}
    borderRadius={2}
    backgroundColor={color}
    accessibilityLabel={accessibilityLabel}
  />
)

const renderLegend = (legend: readonly ContributionLegendViewModel[]): React.ReactNode =>
  legend.map((item) => <LegendCell key={item.id} {...item} />)

const SignalLattice: React.FC<SignalLatticeViewProps> = ({
  headline,
  accessibilityLabel,
  width,
  height,
  monthTicks,
  weekdayTicks,
  cells,
  legend,
  lessLabel,
  moreLabel,
}) => (
  <YStack gap="$2">
    <Text fontFamily="$heading" fontSize="$7" fontWeight="bold">
      {headline}
    </Text>
    <ScrollView horizontal showsHorizontalScrollIndicator maxWidth="100%">
      <Svg
        width={width}
        height={height}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        {renderMonthTicks(monthTicks)}
        {renderMonthTicks(weekdayTicks)}
        {renderCells(cells)}
      </Svg>
    </ScrollView>
    <XStack alignItems="center" gap="$2">
      <Text className="readout-label" fontFamily="$body" fontSize="$2">
        {lessLabel}
      </Text>
      {renderLegend(legend)}
      <Text className="readout-label" fontFamily="$body" fontSize="$2">
        {moreLabel}
      </Text>
    </XStack>
  </YStack>
)

export default SignalLattice
