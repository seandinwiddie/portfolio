import React from 'react';
import { XStack, Text } from 'tamagui';
import { useAppSelector } from '../store/hooks';
import { selectThemeMode } from '../features/themeToggle/themeToggleSlice';
import { selectDataSource } from '../features/body/bodySlice';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';

/**
 * A telemetry rail: the ship-instrument strip that runs under the nav.
 *
 * Every readout is live state, not decoration — the active theme, whether the
 * API is serving or the bundled fallback is in use, and the current repo and
 * contribution counts. It is the same information the Status page reports,
 * kept permanently in view the way a cockpit strip would.
 */
const Cell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <XStack gap="$2" alignItems="center">
    <Text fontFamily="$body" fontSize="$1" letterSpacing={2} opacity={0.5} textTransform="uppercase">
      {label}
    </Text>
    <Text fontFamily="$body" fontSize="$1" letterSpacing={1}>{value}</Text>
  </XStack>
);

const SOURCE_LABEL: Record<string, string> = {
  network: 'LIVE',
  fallback: 'FALLBACK',
  pending: 'SYNC',
};

const Telemetry: React.FC = () => {
  const theme = useAppSelector(selectThemeMode);
  const source = useAppSelector(selectDataSource);
  const { data } = useGetGithubSummaryQuery();

  return (
    <XStack
      className="telemetry"
      position="relative"
      paddingHorizontal="$4"
      paddingVertical="$1"
      gap="$5"
      flexWrap="wrap"
      rowGap="$1"
      backgroundColor="$background"
    >
      <Cell label="feed" value={SOURCE_LABEL[source] ?? source.toUpperCase()} />
      <Cell label="theme" value={theme.toUpperCase()} />
      {data ? <Cell label="units" value={String(data.repos.length)} /> : null}
      {data?.contributions ? (
        <Cell label="output" value={data.contributions.total.toLocaleString()} />
      ) : null}
    </XStack>
  );
};

export default Telemetry;
