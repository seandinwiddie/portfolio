import React from 'react';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import type { ContributionDay, Contributions } from '../data/schemas';

/**
 * Sequential single-hue ramps, light -> dark, one per surface polarity.
 * Both are strictly monotonic in OKLab lightness (dark: 0.344 -> 0.762;
 * light: 0.867 -> 0.478), which is the correct check for a sequential ramp --
 * the categorical CVD checks do not apply. Dark mode is a selected ramp, not an
 * automatic flip of the light one.
 */
const RAMPS = {
  dark: ['#1c2128', '#0e4429', '#006d32', '#26a641', '#39d353'],
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
} as const;

const CELL = 11;
const GAP = 2;          // surface gap between marks
const STEP = CELL + GAP;
const ROWS = 7;
const LABEL_GUTTER = 26;
const MONTH_BAR = 14;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS: ReadonlyArray<readonly [number, string]> = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']];

const dayOf = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Column index = whole weeks elapsed since the first cell's Sunday. */
const gridPositions = (days: ContributionDay[]) => {
  const first = dayOf(days[0].date);
  const offset = first.getUTCDay();
  return days.map((day, index) => {
    const slot = index + offset;
    return { day, column: Math.floor(slot / ROWS), row: slot % ROWS };
  });
};

const monthTicks = (positioned: ReturnType<typeof gridPositions>) =>
  positioned.reduce<Array<{ label: string; column: number }>>((ticks, { day, column }) => {
    const month = dayOf(day.date).getUTCMonth();
    const last = ticks[ticks.length - 1];
    const label = MONTHS[month];
    // One tick per month, at the first column the month appears in.
    return last?.label === label ? ticks : [...ticks, { label, column }];
  }, []);

const describe = (day: ContributionDay) =>
  `${day.count === 0 ? 'No contributions' : `${day.count} contribution${day.count === 1 ? '' : 's'}`} on ${day.date}`;

interface ContributionGraphProps {
  contributions: Contributions;
  /** Chosen by the active theme's ground, not flipped automatically. */
  surface: 'light' | 'dark';
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ contributions, surface }) => {
  const ramp = RAMPS[surface];
  // Axes are recessive ink, never a mark colour.
  const axisInk = surface === 'dark' ? '#8b949e' : '#57606a';
  const positioned = gridPositions(contributions.days);
  const columns = Math.max(...positioned.map((p) => p.column)) + 1;
  const width = LABEL_GUTTER + columns * STEP;
  const height = MONTH_BAR + ROWS * STEP;
  const ticks = monthTicks(positioned);

  return (
    <YStack gap="$2">
      {/* Hero number: the headline the grid supports. */}
      <Text fontFamily="$heading" fontSize="$7" fontWeight="bold">
        {contributions.total.toLocaleString()} contributions in the last year
      </Text>

      {/* Wide content scrolls inside its own container, never the page body. */}
      <ScrollView horizontal showsHorizontalScrollIndicator maxWidth="100%">
        <Svg width={width} height={height} accessibilityLabel={`Contribution calendar: ${contributions.total} contributions in the last year`}>
          {ticks.map(({ label, column }) => (
            <SvgText
              key={`m-${label}-${column}`}
              x={LABEL_GUTTER + column * STEP}
              y={MONTH_BAR - 4}
              fontSize={9}
              fill={axisInk}
            >
              {label}
            </SvgText>
          ))}
          {WEEKDAY_LABELS.map(([row, label]) => (
            <SvgText key={label} x={0} y={MONTH_BAR + row * STEP + CELL - 1} fontSize={9} fill={axisInk}>
              {label}
            </SvgText>
          ))}
          {positioned.map(({ day, column, row }) => (
            <Rect
              key={day.date}
              x={LABEL_GUTTER + column * STEP}
              y={MONTH_BAR + row * STEP}
              width={CELL}
              height={CELL}
              rx={2}
              fill={ramp[Math.min(day.level, 4)]}
              accessibilityLabel={describe(day)}
            />
          ))}
        </Svg>
      </ScrollView>

      <XStack alignItems="center" gap="$2">
        <Text fontFamily="$body" fontSize="$2" opacity={0.7}>Less</Text>
        {ramp.map((color, level) => (
          <YStack key={color} width={CELL} height={CELL} borderRadius={2} backgroundColor={color}
            accessibilityLabel={`Level ${level}`} />
        ))}
        <Text fontFamily="$body" fontSize="$2" opacity={0.7}>More</Text>
      </XStack>
    </YStack>
  );
};

export default ContributionGraph;
