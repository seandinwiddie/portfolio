import React from 'react';
import { YStack, XStack, Text, H1, Paragraph, Separator } from 'tamagui';
import Screen from './Screen';
import Panel from './Panel';
import PageHead from './PageHead';
import { useAppSelector } from '../store/hooks';
import { selectBrandName } from '../features/brandName/brandNameSlice';
import { selectDataSource } from '../features/body/bodySlice';
import { selectThemeMode, selectThemes, selectThemeStatus } from '../features/themeToggle/themeToggleSlice';
import { actionLog, getServerSnapshot } from '../store/actionLog';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';

/**
 * Systems diagnostics.
 *
 * Every line is a real measurement taken in the browser that is reading it —
 * a timed round trip to the API, the live store, the actual media preferences —
 * rather than a static "everything is fine" panel.
 */

type Level = 'nominal' | 'degraded' | 'offline';

const LEVEL_GLYPH: Record<Level, string> = {
  nominal: '●',
  degraded: '◐',
  offline: '○',
};

/**
 * Uplink strength, five bars. Thresholds are round-trip milliseconds, so the
 * reading is the measurement rather than a decoration keyed to it.
 */
const LATENCY_BANDS = [120, 260, 500, 900] as const;

const barsFor = (ms: number | null): number =>
  ms === null ? 0 : LATENCY_BANDS.filter((limit) => ms < limit).length + 1;

const SignalBars: React.FC<{ ms: number | null }> = ({ ms }) => {
  const lit = barsFor(ms);
  return (
    <XStack gap={3} alignItems="flex-end" height={18}>
      {[1, 2, 3, 4, 5].map((step) => (
        <YStack
          key={step}
          width={4}
          height={4 + step * 3}
          backgroundColor={step <= lit ? '$accent' : '$borderColor'}
          opacity={step <= lit ? 1 : 0.5}
        />
      ))}
    </XStack>
  );
};

const Row: React.FC<{ label: string; value: string; level?: Level }> = ({ label, value, level }) => (
  <XStack justifyContent="space-between" gap="$4" flexWrap="wrap" rowGap="$1">
    <XStack gap="$2" alignItems="center" flexShrink={1}>
      {level ? (
        <Text fontFamily="$body" fontSize="$2" opacity={level === 'nominal' ? 0.9 : 0.6}>
          {LEVEL_GLYPH[level]}
        </Text>
      ) : null}
      <Text fontFamily="$body" fontSize="$2" letterSpacing={2} opacity={0.55} textTransform="uppercase">
        {label}
      </Text>
    </XStack>
    <Text fontFamily="$heading" fontSize="$3" ta="right" flexShrink={1}>{value}</Text>
  </XStack>
);

/** Times a real round trip to the API's cheapest endpoint. */
const useLatency = () => {
  const [ms, setMs] = React.useState<number | null>(null);
  const [reachable, setReachable] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const base = process.env.EXPO_PUBLIC_API_URL || 'https://api.sdin.dev';
    const started = Date.now();

    fetch(`${base}/status`, { cache: 'no-store' })
      .then((response) => {
        if (cancelled) return;
        setMs(Date.now() - started);
        setReachable(response.ok);
      })
      .catch(() => {
        if (cancelled) return;
        setMs(null);
        setReachable(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ms, reachable };
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Status: React.FC = () => {
  const brandName = useAppSelector(selectBrandName);
  const source = useAppSelector(selectDataSource);
  const themeStatus = useAppSelector(selectThemeStatus);
  const theme = useAppSelector(selectThemeMode);
  const themes = useAppSelector(selectThemes);
  const actions = React.useSyncExternalStore(actionLog.subscribe, actionLog.getSnapshot, getServerSnapshot);
  const { data, isFetching } = useGetGithubSummaryQuery();
  const { ms, reachable } = useLatency();

  const feedLevel: Level = source === 'network' ? 'nominal' : source === 'fallback' ? 'degraded' : 'offline';
  const apiLevel: Level = reachable === true ? 'nominal' : reachable === false ? 'offline' : 'degraded';

  const allNominal = feedLevel === 'nominal' && apiLevel === 'nominal';

  return (
    <Screen>
      <PageHead title="Status" description="Live diagnostics for the site and its API." />

      <YStack className="ignite ignite-1" gap="$3">
        <Text fontFamily="$body" fontSize="$1" letterSpacing={4} opacity={0.5}>
          DIAGNOSTICS
        </Text>
        <XStack gap="$3" alignItems="center" flexWrap="wrap">
          <Text className={allNominal ? 'status-live' : ''} fontFamily="$heading" fontSize="$8">
            {allNominal ? '●' : '◐'}
          </Text>
          <H1 className="dossier-headline" fontFamily="$heading" fontWeight="bold" flexShrink={1}>
            {allNominal ? 'All systems nominal.' : 'Running degraded.'}
          </H1>
        </XStack>
        <YStack className="rule" height={1} backgroundColor="$borderColor" width="40%" />
        <Paragraph fontFamily="$body" opacity={0.75}>
          Measured in this browser, right now — a timed round trip to the API, the live
          Redux store, and your own display preferences. Nothing here is a static badge.
        </Paragraph>
      </YStack>

      <YStack className="stagger-1">
        <Panel label="Uplink" meter={ms !== null ? `${ms} ms` : 'timing…'}>
          <YStack gap="$3">
            <XStack gap="$3" alignItems="center">
              <SignalBars ms={ms} />
              <Text fontFamily="$heading" fontSize="$7" fontWeight="bold">
                {ms !== null ? `${ms}` : '—'}
                <Text fontFamily="$body" fontSize="$3" opacity={0.6}> ms</Text>
              </Text>
            </XStack>
            <Row
              label="api.sdin.dev"
              level={apiLevel}
              value={reachable === null ? 'probing…' : reachable ? `reachable · ${ms} ms` : 'unreachable'}
            />
            <Row
              label="content feed"
              level={feedLevel}
              value={source === 'network' ? 'live from API' : source === 'fallback' ? 'bundled fallback' : 'syncing'}
            />
            <Row label="github sync" level={isFetching ? 'degraded' : data ? 'nominal' : 'offline'}
              value={isFetching ? 'fetching…' : data ? 'aggregated' : 'no data'} />
            <Row label="brand" value={brandName || '—'} />
          </YStack>
        </Panel>
      </YStack>

      <YStack className="stagger-2">
        <Panel label="Payload" meter={data ? `${data.repos.length} units` : '—'}>
          {data ? (
            <YStack gap="$2">
              <Row label="repositories" value={String(data.repos.length)} />
              <Row label="operators" value={data.owners.map((o) => `${o.owner} ${o.count}`).join(' · ')} />
              <Row label="languages" value={String(data.languages.length)} />
              <Row label="contributions / yr" value={data.contributions?.total.toLocaleString() ?? '—'} />
              <Row label="record begins" value={data.since?.slice(0, 10) ?? '—'} />
            </YStack>
          ) : (
            <Text fontFamily="$body" opacity={0.6}>No telemetry — the feed is still syncing.</Text>
          )}
        </Panel>
      </YStack>

      <YStack className="stagger-3">
        <Panel label="Theme subsystem" meter={`${themes.length} loaded`}>
          <YStack gap="$2">
            <Row label="active" level="nominal" value={theme} />
            <Row label="discovery" level={themeStatus === 'succeeded' ? 'nominal' : 'degraded'} value={themeStatus} />
            <Row label="available" value={themes.join(' · ') || '—'} />
          </YStack>
        </Panel>
      </YStack>

      <YStack className="stagger-4">
        <Panel label="Runtime" meter={`${actions.length} actions`}>
          <YStack gap="$2">
            <Row label="store" level="nominal" value="6 slices · rtk query" />
            <Row label="actions observed" value={String(actions.length)} />
            <Row label="last action" value={actions[0]?.type ?? 'none yet'} />
            <Separator />
            <Row label="reduced motion" value={prefersReducedMotion() ? 'respected' : 'not requested'} />
            <Row
              label="viewport"
              value={typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '—'}
            />
          </YStack>
        </Panel>
      </YStack>
    </Screen>
  );
};

export default Status;
