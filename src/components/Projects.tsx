import React from 'react';
import {
  ScrollView, YStack, XStack, Text, Card, H2, H3, Paragraph, Spinner, Anchor, Separator,
} from 'tamagui';
import PageHead from './PageHead';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';
import type { GithubRepo, LanguageCount } from '../data/schemas';

const relativeAge = (iso: string): string => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  const scale: ReadonlyArray<readonly [number, (n: number) => string]> = [
    [1, () => 'today'],
    [2, () => 'yesterday'],
    [31, (n) => `${n} days ago`],
    [366, (n) => `${Math.floor(n / 30)} months ago`],
  ];
  const matched = scale.find(([limit]) => days < limit);
  return matched ? matched[1](days) : `${Math.floor(days / 365)} years ago`;
};

const LanguageBar: React.FC<{ languages: LanguageCount[] }> = ({ languages }) => {
  const total = languages.reduce((sum, l) => sum + l.count, 0);
  return (
    <XStack flexWrap="wrap" gap="$2">
      {languages.map(({ language, count }) => (
        <XStack key={language} paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10"
          borderWidth={1} borderColor="$borderColor" alignItems="center" gap="$2">
          <Text fontFamily="$body" fontSize="$3">{language}</Text>
          <Text fontFamily="$body" fontSize="$2" opacity={0.7}>
            {count} · {Math.round((count / total) * 100)}%
          </Text>
        </XStack>
      ))}
    </XStack>
  );
};

const RepoCard: React.FC<{ repo: GithubRepo }> = ({ repo }) => (
  <Card padding="$4" elevate bordered>
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
        <Anchor href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" textDecorationLine="none">
          <H3 fontFamily="$heading" color="$color">{repo.name}</H3>
        </Anchor>
        <XStack gap="$3" alignItems="center">
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

/**
 * Live from api.sdin.dev/github. Nothing here is authored by hand -- the page
 * updates itself every time a commit lands.
 */
const Projects: React.FC = () => {
  const { data, isLoading, isError, error } = useGetGithubSummaryQuery();

  return (
    <ScrollView>
      <PageHead title="Projects" description="Live GitHub projects, updated automatically." />
      <YStack padding="$4" gap="$4" maxWidth={900} width="100%" alignSelf="center">
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
            <Paragraph fontFamily="$body">
              Could not reach the projects API{error && 'status' in error ? ` (${String(error.status)})` : ''}.
            </Paragraph>
          </Card>
        ) : null}

        {data ? (
          <>
            <XStack gap="$4" flexWrap="wrap">
              <Text fontFamily="$body"><Text fontWeight="bold">{data.profile.publicRepos}</Text> public repos</Text>
              <Text fontFamily="$body"><Text fontWeight="bold">{data.profile.followers}</Text> followers</Text>
              <Text fontFamily="$body"><Text fontWeight="bold">{data.languages.length}</Text> languages</Text>
            </XStack>

            <Separator />
            <H3 fontFamily="$heading">Languages</H3>
            <LanguageBar languages={data.languages} />

            <Separator />
            <H3 fontFamily="$heading">Recent work</H3>
            <YStack gap="$3">
              {data.repos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
            </YStack>
          </>
        ) : null}
      </YStack>
    </ScrollView>
  );
};

export default Projects;
