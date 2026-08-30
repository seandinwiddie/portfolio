import React from 'react';
import { YStack, XStack, Text } from 'tamagui';
import type { GithubSummary } from '../data/schemas';

/**
 * A unit data plate.
 *
 * The spec-sheet convention from Blade Runner's replicant records and the
 * calm status lines of Weyland's synthetics: designation, incept date,
 * function, output. Every field is read from live data — nothing here is
 * asserted copy, so the plate cannot drift out of date.
 */

const YEAR_MS = 31_557_600_000;

const yearsSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / YEAR_MS);

interface Row {
  readonly key: string;
  readonly value: string;
}

const rowsFor = (data: GithubSummary): Row[] => {
  const topLanguages = data.languages.slice(0, 3).map((l) => l.language).join(' · ');
  const orgs = data.owners.map((o) => o.owner).join(' · ');

  return [
    { key: 'designation', value: (data.profile.name ?? data.profile.login).toUpperCase() },
    { key: 'class', value: 'AI SYSTEMS ARCHITECT' },
    ...(data.since
      ? [{ key: 'incept', value: `${data.since.slice(0, 10)} · ${yearsSince(data.since)} YR RECORD` }]
      : []),
    { key: 'origin', value: (data.profile.location ?? 'UNDISCLOSED').toUpperCase() },
    { key: 'operators', value: orgs.toUpperCase() },
    { key: 'active units', value: `${data.repos.length} REPOSITORIES` },
    { key: 'primary systems', value: topLanguages.toUpperCase() },
    ...(data.contributions
      ? [{ key: 'output', value: `${data.contributions.total.toLocaleString()} CONTRIBUTIONS / CYCLE` }]
      : []),
  ];
};

const UnitPlate: React.FC<{ data: GithubSummary }> = ({ data }) => (
  <YStack
    // Corner brackets + a single scan pass on load.
    className="panel-frame plate-scan"
    borderWidth={1}
    borderColor="$borderColor"
    padding="$4"
    gap="$2"
    width="100%"
    maxWidth={520}
  >
    <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
      <Text fontFamily="$body" fontSize="$1" letterSpacing={3} opacity={0.6}>
        UNIT RECORD
      </Text>
      <Text fontFamily="$body" fontSize="$1" letterSpacing={2} opacity={0.6}>
        ● OPERATIONAL
      </Text>
    </XStack>

    <YStack gap="$1">
      {rowsFor(data).map(({ key, value }) => (
        <XStack key={key} justifyContent="space-between" gap="$4" flexWrap="wrap">
          <Text fontFamily="$body" fontSize="$2" letterSpacing={2} opacity={0.55} textTransform="uppercase">
            {key}
          </Text>
          <Text fontFamily="$body" fontSize="$2" letterSpacing={1} flexShrink={1} ta="right">
            {value}
          </Text>
        </XStack>
      ))}
    </YStack>
  </YStack>
);

export default UnitPlate;
