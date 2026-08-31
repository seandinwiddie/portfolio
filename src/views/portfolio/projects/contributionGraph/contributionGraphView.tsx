import type React from 'react'
import Svg, { Rect, Text as SvgText } from 'react-native-svg'
import { ScrollView, Text, XStack, YStack } from 'tamagui'
import type {
  ContributionCellViewModel,
  ContributionGraphViewProps,
  ContributionLegendViewModel,
  ContributionTickViewModel,
} from '../../../../features/systems/portfolio/projects/projects/contributionGraph/contributionGraphSelectors'

const MonthTick: React.FC<ContributionTickViewModel> = ({ label, x, y, fill }) => (
  <SvgText x={x} y={y} fontSize={9} fill={fill}>
    {label}
  </SvgText>
)

const renderMonthTicks = ([
  tick,
  ...rest
]: readonly ContributionTickViewModel[]): React.ReactNode =>
  tick ? (
    <>
      <MonthTick {...tick} />
      {renderMonthTicks(rest)}
    </>
  ) : null

const ContributionCell: React.FC<ContributionCellViewModel> = ({
  testId,
  x,
  y,
  size,
  fill,
}) => <Rect testID={testId} x={x} y={y} width={size} height={size} rx={2} fill={fill} />

const renderCells = ([
  cell,
  ...rest
]: readonly ContributionCellViewModel[]): React.ReactNode =>
  cell ? (
    <>
      <ContributionCell {...cell} />
      {renderCells(rest)}
    </>
  ) : null

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

const renderLegend = ([
  item,
  ...rest
]: readonly ContributionLegendViewModel[]): React.ReactNode =>
  item ? (
    <>
      <LegendCell {...item} />
      {renderLegend(rest)}
    </>
  ) : null

const ContributionGraph: React.FC<ContributionGraphViewProps> = ({
  headline,
  accessibilityLabel,
  width,
  height,
  monthTicks,
  weekdayTicks,
  cells,
  legend,
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
        Less
      </Text>
      {renderLegend(legend)}
      <Text className="readout-label" fontFamily="$body" fontSize="$2">
        More
      </Text>
    </XStack>
  </YStack>
)

export default ContributionGraph
