import React from 'react';
import { YStack, XStack, Text, H1, H2, H3, Paragraph, Anchor, Spinner } from 'tamagui';
import Screen from './Screen';
import Panel from './Panel';
import PageHead from './PageHead';
import { useAppSelector } from '../store/hooks';
import { selectAbout } from '../features/body/bodySlice';
import { useGetGithubSummaryQuery } from '../features/api/apiSlice';
import type { AboutDomain, AboutPrinciple, GithubRepo, LanguageCount } from '../data/schemas';

/**
 * The dossier: what the work is, with every claim wired to the repository that
 * evidences it. Narrative comes from the API (authored, editable without a
 * deploy); the evidence beside it is live GitHub data, so a capability claim
 * cannot outlive the code that backs it.
 */

const YEAR_MS = 31_557_600_000;

const StatColumn: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <YStack minWidth={104} gap="$1">
    <Text fontFamily="$heading" fontSize="$9" fontWeight="bold" letterSpacing={-1}>{value}</Text>
    <Text fontFamily="$body" fontSize="$1" letterSpacing={2} opacity={0.55} textTransform="uppercase">
      {label}
    </Text>
  </YStack>
);

/** A repo chip, only rendered when the repository actually exists upstream. */
const RepoChip: React.FC<{ repo: GithubRepo }> = ({ repo }) => (
  <Anchor href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" textDecorationLine="none">
    <XStack
      paddingHorizontal="$3"
      paddingVertical="$1"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$2"
      alignItems="center"
      hoverStyle={{ borderColor: '$accent' }}
    >
      <Text fontFamily="$body" fontSize="$2">{repo.name}</Text>
      {repo.language ? (
        <Text fontFamily="$body" fontSize="$1" opacity={0.55}>{repo.language}</Text>
      ) : null}
    </XStack>
  </Anchor>
);

const DomainPanel: React.FC<{ domain: AboutDomain; index: number; repos: GithubRepo[] }> = ({
  domain,
  index,
  repos,
}) => {
  // Only surface evidence that still exists; a renamed repo drops out quietly.
  const evidence = domain.repos
    .map((full) => repos.find((r) => r.fullName === full))
    .filter((r): r is GithubRepo => Boolean(r));

  return (
    <YStack className={`stagger-${index + 1}`}>
      <Panel label={domain.title} meter={`${String(index + 1).padStart(2, '0')} / 04`}>
      <XStack gap="$4" alignItems="flex-start">
        <Text className="domain-index" fontFamily="$heading" fontWeight="bold" display="none" $gtSm={{ display: 'flex' }}>
          {String(index + 1).padStart(2, '0')}
        </Text>
        <YStack gap="$3" flexShrink={1}>
        <Paragraph fontFamily="$body" fontSize="$5">{domain.summary}</Paragraph>
        <Paragraph fontFamily="$body" opacity={0.75}>{domain.detail}</Paragraph>
        {evidence.length > 0 ? (
          <YStack gap="$2">
            <Text fontFamily="$body" fontSize="$1" letterSpacing={2} opacity={0.5} textTransform="uppercase">
              evidence
            </Text>
            <XStack gap="$2" flexWrap="wrap" rowGap="$2">
              {evidence.map((repo) => <RepoChip key={repo.id} repo={repo} />)}
            </XStack>
          </YStack>
        ) : null}
        </YStack>
      </XStack>
      </Panel>
    </YStack>
  );
};

/**
 * One continuous part-to-whole readout of the language mix. Segment opacity
 * steps down monotonically with share, so the ordering is legible without
 * colour — and every segment is directly labelled, so identity is never
 * carried by the bar alone.
 */
const LanguageSpectrum: React.FC<{ languages: LanguageCount[] }> = ({ languages }) => {
  const total = languages.reduce((sum, l) => sum + l.count, 0);
  if (total === 0) return null;

  return (
    <YStack gap="$3">
      <XStack className="spectrum">
        {languages.map((l, index) => (
          <YStack
            key={l.language}
            flexGrow={l.count}
            flexBasis={0}
            backgroundColor="$accent"
            opacity={Math.max(0.25, 1 - index * 0.08)}
          />
        ))}
      </XStack>
      <XStack gap="$3" flexWrap="wrap" rowGap="$2">
        {languages.map((l) => (
          <XStack key={l.language} gap="$2" alignItems="center">
            <Text fontFamily="$body" fontSize="$2">{l.language}</Text>
            <Text fontFamily="$body" fontSize="$1" opacity={0.55}>
              {Math.round((l.count / total) * 100)}%
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
};

const PrincipleRow: React.FC<{ principle: AboutPrinciple }> = ({ principle }) => (
  <YStack gap="$1">
    <Text fontFamily="$heading" fontSize="$5">{principle.title}</Text>
    <Paragraph fontFamily="$body" opacity={0.75}>{principle.description}</Paragraph>
  </YStack>
);

const About: React.FC = () => {
  const about = useAppSelector(selectAbout);
  const { data } = useGetGithubSummaryQuery();

  const years = data?.since ? Math.floor((Date.now() - new Date(data.since).getTime()) / YEAR_MS) : null;

  return (
    <Screen>
      <PageHead title="About" description="What I build, and the repositories that evidence it." />

      {about ? (
        <YStack className="ignite ignite-1" gap="$4" maxWidth={760}>
          <Text fontFamily="$body" fontSize="$1" letterSpacing={4} opacity={0.5}>
            ᚠ ᛫ ᛟ ᛫ ᚱ ᛫ ᛒ ᛫ ᛟ ᛫ ᚲ
          </Text>
          <H1 className="dossier-headline" fontFamily="$heading" fontWeight="bold">
            {about.headline}
          </H1>
          <YStack className="rule" height={1} backgroundColor="$borderColor" width="45%" />
          <Paragraph className="dossier-statement" fontFamily="$body" opacity={0.85}>
            {about.statement}
          </Paragraph>
        </YStack>
      ) : (
        <XStack gap="$2" alignItems="center"><Spinner /><Text fontFamily="$body">Loading…</Text></XStack>
      )}

      {data ? (
        <XStack className="ignite ignite-2" gap="$6" flexWrap="wrap" rowGap="$4">
          {years !== null ? <StatColumn value={`${years}`} label="years shipping" /> : null}
          <StatColumn value={String(data.repos.length)} label="repositories" />
          <StatColumn value={String(data.languages.length)} label="languages" />
          {data.contributions ? (
            <StatColumn value={data.contributions.total.toLocaleString()} label="contributions / yr" />
          ) : null}
        </XStack>
      ) : null}

      {about?.domains.map((domain, index) => (
        <DomainPanel key={domain.id} domain={domain} index={index} repos={data?.repos ?? []} />
      ))}

      {data && data.languages.length > 0 ? (
        <YStack className="stagger-5">
          <Panel label="Language range" meter={`${data.languages.length} in use`}>
            <LanguageSpectrum languages={data.languages} />
          </Panel>
        </YStack>
      ) : null}

      {about?.principles.length ? (
        <Panel label="How I work" meter={`${about.principles.length} rules`}>
          <YStack gap="$4">
            {about.principles.map((principle) => (
              <PrincipleRow key={principle.id} principle={principle} />
            ))}
          </YStack>
        </Panel>
      ) : null}
    </Screen>
  );
};

export default About;
