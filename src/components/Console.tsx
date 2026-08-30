import React from 'react';
import { YStack, XStack, Text, Input, ScrollView, useMedia } from 'tamagui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  cycleTheme,
  setThemeMode,
  selectThemeMode,
  selectThemes,
} from '../features/themeToggle/themeToggleSlice';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';
import type { GithubSummary } from '../data/schemas';

/**
 * MU-TH-UR: a working console, not a prop.
 *
 * Opened with the backtick key. Every command reads the same live API data the
 * pages render, and `theme` dispatches into the real store — so the console
 * drives the actual application rather than replaying a canned script.
 *
 * Commands are a dispatch table keyed by verb; there is no if-chain to grow.
 */

type Ctx = {
  data?: GithubSummary;
  themes: string[];
  run: (action: unknown) => void;
};

type Command = {
  readonly summary: string;
  readonly run: (arg: string, ctx: Ctx) => string[];
};

const NO_DATA = ['no telemetry yet — the feed is still syncing.'];

const COMMANDS: Record<string, Command> = {
  help: {
    summary: 'list commands',
    run: () => [
      'available commands',
      ...Object.entries(COMMANDS).map(([name, c]) => `  ${name.padEnd(10)} ${c.summary}`),
      '',
      'backtick (`) closes this console.',
    ],
  },
  whoami: {
    summary: 'unit record',
    run: (_a, { data }) =>
      data
        ? [
            `designation  ${data.profile.name ?? data.profile.login}`,
            `origin       ${data.profile.location ?? 'undisclosed'}`,
            `incept       ${data.since?.slice(0, 10) ?? 'unknown'}`,
            `units        ${data.repos.length} repositories`,
            `output       ${data.contributions?.total.toLocaleString() ?? '—'} contributions / cycle`,
          ]
        : NO_DATA,
  },
  repos: {
    summary: 'most recently touched repositories',
    run: (arg, { data }) => {
      if (!data) return NO_DATA;
      const owner = arg.trim().toLowerCase();
      const list = owner
        ? data.repos.filter((r) => r.owner.toLowerCase() === owner)
        : data.repos;
      return list.length === 0
        ? [`no repositories for "${arg.trim()}"`]
        : list.slice(0, 12).map((r) => `${r.fullName.padEnd(38)} ${r.language ?? '—'}`);
    },
  },
  langs: {
    summary: 'language distribution',
    run: (_a, { data }) =>
      data ? data.languages.map((l) => `${l.language.padEnd(14)} ${'█'.repeat(l.count)} ${l.count}`) : NO_DATA,
  },
  activity: {
    summary: 'recent public activity by repository',
    run: (_a, { data }) =>
      data ? data.activity.byRepo.map((r) => `${r.repo.padEnd(38)} ${r.count}`) : NO_DATA,
  },
  theme: {
    summary: 'set or cycle the theme',
    run: (arg, { themes, run }) => {
      const name = arg.trim().toLowerCase();
      if (!name) {
        run(cycleTheme());
        return ['cycled.'];
      }
      if (!themes.includes(name)) {
        return [`unknown theme "${name}". available: ${themes.join(', ')}`];
      }
      run(setThemeMode(name));
      return [`theme set to ${name}.`];
    },
  },
};

const PROMPT = '>';

const Console: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [entry, setEntry] = React.useState('');
  const [lines, setLines] = React.useState<string[]>([
    'MU-TH-UR 6000 // interface ready',
    'type `help` for commands.',
  ]);

  const media = useMedia();
  const dispatch = useAppDispatch();
  const themes = useAppSelector(selectThemes);
  const mode = useAppSelector(selectThemeMode);
  const { data } = useGetGithubSummaryQuery();

  // Backtick toggles, unless the visitor is typing into a field.
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (event.key === '`' && (!typing || open)) {
        event.preventDefault();
        setOpen((was) => !was);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = () => {
    const raw = entry.trim();
    setEntry('');
    if (raw.length === 0) return;

    const [verb, ...rest] = raw.split(' ');
    const command = COMMANDS[verb.toLowerCase()];
    const output = command
      ? command.run(rest.join(' '), { data, themes, run: dispatch })
      : [`unknown command "${verb}". type \`help\`.`];

    setLines((prev) => [...prev, `${PROMPT} ${raw}`, ...output].slice(-120));
  };

  if (!open) {
    // The hint is a keyboard affordance; on a phone it is only clutter.
    if (!media.gtSm) return null;
    return (
      <XStack position="absolute" bottom={56} left={12} pointerEvents="box-none">
        <Text
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={2}
          opacity={0.45}
          onPress={() => setOpen(true)}
          cursor="pointer"
          accessibilityLabel="Open the console"
        >
          ` CONSOLE
        </Text>
      </XStack>
    );
  }

  return (
    <YStack
      className="panel-frame"
      position="absolute"
      bottom={56}
      left={12}
      right={12}
      maxWidth={640}
      backgroundColor="$background"
      borderWidth={1}
      borderColor="$borderColor"
      padding="$3"
      gap="$2"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$body" fontSize="$1" letterSpacing={3} opacity={0.6}>MU-TH-UR 6000</Text>
        <Text fontFamily="$body" fontSize="$1" opacity={0.6} onPress={() => setOpen(false)} cursor="pointer">
          close
        </Text>
      </XStack>

      <ScrollView maxHeight={220}>
        <YStack>
          {lines.map((line, index) => (
            <Text key={`${index}-${line}`} fontFamily="$heading" fontSize="$2" opacity={line.startsWith(PROMPT) ? 1 : 0.75}>
              {line}
            </Text>
          ))}
        </YStack>
      </ScrollView>

      <XStack gap="$2" alignItems="center">
        <Text fontFamily="$heading" fontSize="$3" opacity={0.7}>{PROMPT}</Text>
        <Input
          flex={1}
          size="$3"
          value={entry}
          onChangeText={setEntry}
          onSubmitEditing={submit}
          placeholder={`theme ${mode === 'neon' ? 'mirage' : 'neon'}`}
          fontFamily="$heading"
          borderWidth={0}
          backgroundColor="transparent"
          autoFocus
        />
      </XStack>
    </YStack>
  );
};

export default Console;
