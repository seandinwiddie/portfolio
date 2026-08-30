import React from 'react';
import { YStack, XStack, Text } from 'tamagui';
import type { ContributionDay } from '../data/schemas';

/**
 * The hero readout: a year of real contributions drawn as a monospace trace.
 *
 * Deliberately NOT a chart — no axes, no legend, no tooltip. It is an
 * instrument display in the same terminal vernacular as the rest of the
 * identity (Dank Mono, runic markers, phosphor). The analytical view of the
 * same data lives on /projects as a proper heatmap.
 *
 * It redraws itself from live data, so it is different every week he ships.
 */

/** Eight levels of vertical fill, U+2581..U+2588. */
const GLYPHS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const;

/** His own marker, taken from the profile README rather than invented. */
const RUNE_MARK = 'ᚠ ᛫ ᛟ ᛫ ᚱ ᛫ ᛒ ᛫ ᛟ ᛫ ᚲ';

const WEEK = 7;

/** Folds days into calendar weeks, then maps each week's volume onto a glyph. */
const traceOf = (days: ContributionDay[]): string => {
  const weeks = days.reduce<number[]>((acc, day, index) => {
    const bucket = Math.floor(index / WEEK);
    const next = [...acc];
    next[bucket] = (next[bucket] ?? 0) + day.count;
    return next;
  }, []);

  const peak = Math.max(...weeks, 1);

  return weeks
    .map((total) => {
      // Any activity at all reads as at least one bar; silence stays flat.
      const level = total === 0 ? 0 : Math.max(1, Math.ceil((total / peak) * (GLYPHS.length - 1)));
      return GLYPHS[level];
    })
    .join('');
};

interface SignalTraceProps {
  days: ContributionDay[];
  total: number;
}

const SignalTrace: React.FC<SignalTraceProps> = ({ days, total }) => {
  if (days.length === 0) {
    return null;
  }

  const trace = traceOf(days);

  return (
    <YStack gap="$2" alignItems="center" maxWidth="100%">
      <XStack gap="$3" alignItems="center" opacity={0.55}>
        <Text fontFamily="$body" fontSize="$1" letterSpacing={2}>{RUNE_MARK}</Text>
      </XStack>

      <Text
        // Web-only escape hatch for the phosphor sweep and scanline layers,
        // which have no React Native equivalent.
        className="signal-trace"
        fontFamily="$heading"
        color="$color"
        fontSize={13}
        $sm={{ fontSize: 8 }}
        selectable={false}
        accessibilityLabel={`Signal trace of ${total} contributions over the last year`}
      >
        {trace}
      </Text>

      <Text fontFamily="$body" fontSize="$2" opacity={0.6} letterSpacing={1}>
        {total.toLocaleString()} contributions · 52 weeks
      </Text>
    </YStack>
  );
};

export default SignalTrace;
