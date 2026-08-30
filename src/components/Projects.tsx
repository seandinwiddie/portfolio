import React from 'react';
import {
  YStack, XStack, Text, Card, H2, H3, Paragraph, Spinner, Anchor, Separator,
} from 'tamagui';
import Screen from './Screen';
import PageHead from './PageHead';
import ContributionGraph from './ContributionGraph';
import { useAppSelector } from '../store/hooks';
import { selectSurface } from '../features/themeToggle/themeToggleSlice';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';
import type { Activity, GithubRepo, LanguageCount, OwnerCount } from '../data/schemas';

const DAY_MS = 86_400_000;

const relativeAge = (iso: string): string => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  const scale: ReadonlyArray<readonly [number, (n: number) => string]> = [
    [1, () => 'today'],
    [2, () => 'yesterday'],
    [31, (n) => `${n} days ago`],
    [366, (n) => `${Math.floor(n / 30)} months ago`],
  ];
  const matched = scale.find(([limit]) => days < limit);
  return matched ? matched[1](days) : `${Math.floor(days / 365)} years ago`;
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <XStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10"
    borderWidth={1} borderColor="$borderColor" alignItems="center" gap="$2">
    {children}
  </XStack>
);

const Stat: React.FC<{ value: React.ReactNode; label: string }> = ({ value, label }) => (
  <YStack minWidth={92}>
    <Text fontFamily="$heading" fontSize="$8" fontWeight="bold">{value}</Text>
    <Text fontFamily="$body" fontSize="$2" opacity={0.7}>{label}</Text>
  </YStack>
);

const LanguageBar: React.FC<{ languages: LanguageCount[] }> = ({ languages }) => {
  const total = languages.reduce((sum, l) => sum + l.count, 0);
  return (
    <XStack flexWrap="wrap" gap="$2">
      {languages.map(({ language, count }) => (
        <Pill key={language}>
          <Text fontFamily="$body" fontSize="$3">{language}</Text>
          <Text fontFamily="$body" fontSize="$2" opacity={0.7}>
            {count} · {Math.round((count / total) * 100)}%
          </Text>
        </Pill>
      ))}
    </XStack>
  );
};

const ActivityPanel: React.FC<{ activity: Activity }> = ({ activity }) => (
  <YStack gap="$3">
    <XStack flexWrap="wrap" gap="$2">
      {activity.byKind.map(({ kind, count }) => (
        <Pill key={kind}>
          <Text fontFamily="$body" fontSize="$3">{kind}{count === 1 ? '' : 's'}</Text>
          <Text fontFamily="$body" fontSize="$2" opacity={0.7}>{count}</Text>
        </Pill>
      ))}
    </XStack>
    <YStack gap="$2">
      {activity.byRepo.map(({ repo, count }) => (
        <XStack key={repo} justifyContent="space-between" gap="$3" flexWrap="wrap">
          <Anchor href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer"
            fontFamily="$body" fontSize="$3" flexShrink={1}>
            {repo}
          </Anchor>
          <Text fontFamily="$body" fontSize="$3" opacity={0.8}>{count} events</Text>
        </XStack>
      ))}
    </YStack>
    {activity.since ? (
      <Text fontFamily="$body" fontSize="$2" opacity={0.6}>
        {activity.total} public events since {relativeAge(activity.since)}
      </Text>
    ) : null}
  </YStack>
);

const RepoCard: React.FC<{ repo: GithubRepo }> = ({ repo }) => (
  <Card padding="$4" elevate bordered>
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <Anchor href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" textDecorationLine="none" flexShrink={1}>
          <H3 fontFamily="$heading" color="$color">{repo.name}</H3>
        </Anchor>
        <XStack gap="$3" alignItems="center" flexWrap="wrap">
          {repo.language ? <Text fontFamily="$body" fontSize="$2" opacity={0.8}>{repo.language}</Text> : null}
          {repo.stars > 0 ? <Text fontFamily="$body" fontSize="$2" opacity={0.8}>★ {repo.stars}</Text> : null}
        </XStack>
      </XStack>
      <Paragraph fontFamily="$body" opacity={repo.description ? 1 : 0.6}>
        {repo.description ?? 'No description yet.'}
      </Paragraph>
      <Text fontFamily="$body" fontSize="$2" opacity={0.6}>Updated {relativeAge(repo.pushedAt)}</Text>
    </YStack>
  </Card>
);

const OwnerSection: React.FC<{ owner: OwnerCount; repos: GithubRepo[] }> = ({ owner, repos }) => (
  <YStack gap="$3">
    <XStack alignItems="center" gap="$2" flexWrap="wrap">
      <H3 fontFamily="$heading">{owner.owner}</H3>
      <Text fontFamily="$body" fontSize="$2" opacity={0.7}>{owner.count} repos</Text>
    </XStack>
    <YStack gap="$3">
      {repos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
    </YStack>
  </YStack>
);

/**
 * Live from api.sdin.dev/github. Nothing here is authored by hand -- the page
 * updates itself every time a commit lands, across the personal account and the
 * ForbocAI organisation.
 */
const Projects: React.FC = () => {
  const { data, isLoading, isError } = useGetGithubSummaryQuery();
  const surface = useAppSelector(selectSurface);

  return (
    <Screen>
      <PageHead title="Projects" description="Live GitHub projects and activity, updated automatically." />
      <YStack gap="$2">
        <H2 fontFamily="$heading">Projects</H2>
        <Paragraph fontFamily="$body" opacity={0.8}>
          Pulled live from GitHub — this page updates itself whenever I push.
        </Paragraph>
      </YStack>

      {isLoading ? (
        <XStack gap="$2" alignItems="center"><Spinner /><Text fontFamily="$body">Loading projects…</Text></XStack>
      ) : null}

      {isError ? (
        <Card padding="$4" bordered>
          {/* Plain language: the previous copy leaked the internal FETCH_ERROR code. */}
          <Paragraph fontFamily="$body">
            Couldn’t reach the projects service just now. Everything else on the site still works.
          </Paragraph>
        </Card>
      ) : null}

      {data ? (
        <>
          <XStack gap="$5" flexWrap="wrap" rowGap="$3">
            <Stat value={data.repos.length} label="repos shown" />
            <Stat value={data.languages.length} label="languages" />
            <Stat value={data.activity.total} label="recent events" />
            <Stat value={data.profile.followers} label="followers" />
          </XStack>

          {data.contributions ? (
            <>
              <Separator />
              <ContributionGraph contributions={data.contributions} surface={surface} />
            </>
          ) : null}

          <Separator />
          <H3 fontFamily="$heading">Recent activity</H3>
          <ActivityPanel activity={data.activity} />

          <Separator />
          <H3 fontFamily="$heading">Languages</H3>
          <LanguageBar languages={data.languages} />

          <Separator />
          {data.owners.map((owner) => (
            <OwnerSection
              key={owner.owner}
              owner={owner}
              repos={data.repos.filter((r) => r.owner === owner.owner)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
};

export default Projects;
